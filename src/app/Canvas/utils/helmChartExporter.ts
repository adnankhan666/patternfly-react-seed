import { NodeData, Connection, HelmGlobalValues } from '../types';
import { generateHelmNodeYaml } from './helmYamlGenerator';
import JSZip from 'jszip';

export interface ValidationError {
  nodeId: string;
  nodeName: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  nodeId?: string;
  nodeName?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validate a Helm node has all required fields configured
 */
const validateNodeFields = (node: NodeData): ValidationError[] => {
  const errors: ValidationError[] = [];
  const helmConfig = node.data?.helmConfig;

  if (!helmConfig) {
    errors.push({
      nodeId: node.id,
      nodeName: node.label,
      message: 'Node is missing Helm configuration',
    });
    return errors;
  }

  const { resourceType, values } = helmConfig;

  // Validate based on resource type
  switch (resourceType) {
    case 'oci-secret':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Secret name is required',
          field: 'name',
        });
      }
      if (!values.uri || values.uri.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'OCI URI is required',
          field: 'uri',
        });
      } else if (!values.uri.startsWith('oci://')) {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'URI must start with oci://',
          field: 'uri',
        });
      }
      break;

    case 'serving-runtime':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Runtime name is required',
          field: 'name',
        });
      }
      if (!values.imageRepo || values.imageRepo.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Image repository is required',
          field: 'imageRepo',
        });
      }
      if (!values.imageTag || values.imageTag.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Image tag is required',
          field: 'imageTag',
        });
      }
      break;

    case 'inference-service':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Model name is required',
          field: 'name',
        });
      }
      if (!values.storageUri || values.storageUri.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Storage URI is required',
          field: 'storageUri',
        });
      }
      break;

    case 'pvc':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'PVC name is required',
          field: 'name',
        });
      }
      if (!values.size || values.size.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Storage size is required',
          field: 'size',
        });
      } else if (!/^\d+(Gi|Mi|Ti|G|M|T)$/.test(values.size)) {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Size must be in format like 20Gi, 1Ti, etc.',
          field: 'size',
        });
      }
      break;

    case 'rbac':
      if (!values.serviceAccountName || values.serviceAccountName.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Service account name is required',
          field: 'serviceAccountName',
        });
      }
      break;

    case 'notebook':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Notebook name is required',
          field: 'name',
        });
      }
      if (!values.image || values.image.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Image is required',
          field: 'image',
        });
      }
      break;

    case 'job':
      if (!values.name || values.name.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Job name is required',
          field: 'name',
        });
      }
      if (!values.gitRepoUrl || values.gitRepoUrl.trim() === '') {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Git repository URL is required',
          field: 'gitRepoUrl',
        });
      } else if (!/^https?:\/\/.+/.test(values.gitRepoUrl)) {
        errors.push({
          nodeId: node.id,
          nodeName: node.label,
          message: 'Git URL must start with http:// or https://',
          field: 'gitRepoUrl',
        });
      }
      break;
  }

  return errors;
};

/**
 * Validate node dependencies are properly connected
 */
const validateNodeDependencies = (
  nodes: NodeData[],
  connections: Connection[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Build a map of node connections
  const nodeConnections = new Map<string, { incoming: string[]; outgoing: string[] }>();
  nodes.forEach((node) => {
    nodeConnections.set(node.id, { incoming: [], outgoing: [] });
  });

  connections.forEach((conn) => {
    const source = nodeConnections.get(conn.source);
    const target = nodeConnections.get(conn.target);
    if (source) source.outgoing.push(conn.target);
    if (target) target.incoming.push(conn.source);
  });

  nodes.forEach((node) => {
    const helmConfig = node.data?.helmConfig;
    if (!helmConfig) return;

    const conns = nodeConnections.get(node.id);
    if (!conns) return;

    const { resourceType } = helmConfig;

    // Check required dependencies
    switch (resourceType) {
      case 'inference-service':
        // Must be connected to ServingRuntime and OCI Secret
        const hasRuntime = conns.incoming.some((srcId) => {
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode?.data?.helmConfig?.resourceType === 'serving-runtime';
        });
        const hasSecret = conns.incoming.some((srcId) => {
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode?.data?.helmConfig?.resourceType === 'oci-secret';
        });

        if (!hasRuntime) {
          errors.push({
            nodeId: node.id,
            nodeName: node.label,
            message: 'InferenceService must be connected to a ServingRuntime',
          });
        }
        if (!hasSecret) {
          errors.push({
            nodeId: node.id,
            nodeName: node.label,
            message: 'InferenceService must be connected to an OCI Secret',
          });
        }
        break;

      case 'notebook':
        // Must be connected to PVC and RBAC
        const hasPvc = conns.incoming.some((srcId) => {
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode?.data?.helmConfig?.resourceType === 'pvc';
        });
        const hasRbac = conns.incoming.some((srcId) => {
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode?.data?.helmConfig?.resourceType === 'rbac';
        });

        if (!hasPvc) {
          errors.push({
            nodeId: node.id,
            nodeName: node.label,
            message: 'Notebook must be connected to a PVC',
          });
        }
        if (!hasRbac) {
          errors.push({
            nodeId: node.id,
            nodeName: node.label,
            message: 'Notebook must be connected to RBAC',
          });
        }
        break;

      case 'job':
        // Must be connected to Notebook
        const hasNotebook = conns.incoming.some((srcId) => {
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode?.data?.helmConfig?.resourceType === 'notebook';
        });

        if (!hasNotebook) {
          errors.push({
            nodeId: node.id,
            nodeName: node.label,
            message: 'Job must be connected to a Notebook',
          });
        }
        break;
    }
  });

  return errors;
};

/**
 * Validate global values
 */
const validateGlobalValues = (globals: HelmGlobalValues): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!globals.namespace || globals.namespace.trim() === '') {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'Namespace is required',
      field: 'namespace',
    });
  } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(globals.namespace)) {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'Namespace must be lowercase alphanumeric with hyphens',
      field: 'namespace',
    });
  }

  if (!globals.chartName || globals.chartName.trim() === '') {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'Chart name is required',
      field: 'chartName',
    });
  }

  if (!globals.chartVersion || globals.chartVersion.trim() === '') {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'Chart version is required',
      field: 'chartVersion',
    });
  } else if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(globals.chartVersion)) {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'Chart version must be valid semver (e.g., 1.0.0)',
      field: 'chartVersion',
    });
  }

  if (!globals.appVersion || globals.appVersion.trim() === '') {
    errors.push({
      nodeId: 'global',
      nodeName: 'Global Values',
      message: 'App version is required',
      field: 'appVersion',
    });
  }

  return errors;
};

/**
 * Generate warnings for potential issues
 */
const generateWarnings = (nodes: NodeData[], connections: Connection[]): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  // Check for orphaned nodes
  const connectedNodes = new Set<string>();
  connections.forEach((conn) => {
    connectedNodes.add(conn.source);
    connectedNodes.add(conn.target);
  });

  nodes.forEach((node) => {
    if (!node.data?.helmConfig) return;
    if (!connectedNodes.has(node.id) && nodes.length > 1) {
      warnings.push({
        nodeId: node.id,
        nodeName: node.label,
        message: `${node.label} is not connected to any other nodes`,
      });
    }
  });

  // Warn if no nodes
  if (nodes.filter((n) => n.data?.helmConfig).length === 0) {
    warnings.push({
      message: 'Workflow contains no Helm resource nodes',
    });
  }

  return warnings;
};

/**
 * Main validation function for Helm workflows
 */
export const validateHelmWorkflow = (
  nodes: NodeData[],
  connections: Connection[],
  globals: HelmGlobalValues
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Filter to only Helm nodes
  const helmNodes = nodes.filter((node) => node.data?.helmConfig);

  // Validate global values
  errors.push(...validateGlobalValues(globals));

  // Validate each node
  helmNodes.forEach((node) => {
    errors.push(...validateNodeFields(node));
  });

  // Validate dependencies
  errors.push(...validateNodeDependencies(helmNodes, connections));

  // Generate warnings
  warnings.push(...generateWarnings(helmNodes, connections));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Generate Chart.yaml content
 */
export const generateChartYaml = (globals: HelmGlobalValues): string => {
  return `apiVersion: v2
name: ${globals.chartName}
description: Generated Helm chart from Workflow Canvas
type: application
version: ${globals.chartVersion}
appVersion: "${globals.appVersion}"
`;
};

/**
 * Generate values.yaml content from all Helm nodes
 */
export const generateValuesYaml = (nodes: NodeData[], globals: HelmGlobalValues): string => {
  const helmNodes = nodes.filter((node) => node.data?.helmConfig);
  
  let yaml = `# Generated values.yaml\nnamespace: ${globals.namespace}\n\n`;

  // Extract values from each node type
  const secretNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'oci-secret');
  const runtimeNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'serving-runtime');
  const inferenceNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'inference-service');
  const pvcNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'pvc');
  const rbacNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'rbac');
  const notebookNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'notebook');
  const jobNodes = helmNodes.filter((n) => n.data?.helmConfig?.resourceType === 'job');

  // Image config from ServingRuntime
  if (runtimeNodes.length > 0) {
    const runtime = runtimeNodes[0].data?.helmConfig?.values;
    yaml += `image:\n`;
    yaml += `  repository: ${runtime.imageRepo || 'quay.io/vllm/vllm-cuda'}\n`;
    yaml += `  tag: "${runtime.imageTag || '0.9.2.2'}"\n`;
    yaml += `  pullPolicy: ${runtime.imagePullPolicy || 'IfNotPresent'}\n\n`;
  }

  // Model config
  if (inferenceNodes.length > 0 || secretNodes.length > 0) {
    yaml += `model:\n`;
    if (inferenceNodes.length > 0) {
      const inference = inferenceNodes[0].data?.helmConfig?.values;
      yaml += `  name: "${inference.name || 'model'}"\n`;
      yaml += `  storageUri: "${inference.storageUri || ''}"\n`;
    }
    if (secretNodes.length > 0) {
      const secret = secretNodes[0].data?.helmConfig?.values;
      yaml += `  connectionSecretName: "${secret.name || 'model-secret'}"\n`;
    }
    yaml += `\n`;
  }

  // Resources from InferenceService
  if (inferenceNodes.length > 0) {
    const inference = inferenceNodes[0].data?.helmConfig?.values;
    yaml += `resources:\n`;
    yaml += `  requests:\n`;
    yaml += `    cpu: "${inference.cpuRequest || '4'}"\n`;
    yaml += `    memory: "${inference.memoryRequest || '8Gi'}"\n`;
    yaml += `    gpu: "${inference.gpuRequest || '1'}"\n`;
    yaml += `  limits:\n`;
    yaml += `    cpu: "${inference.cpuLimit || '8'}"\n`;
    yaml += `    memory: "${inference.memoryLimit || '10Gi'}"\n`;
    yaml += `    gpu: "${inference.gpuLimit || '1'}"\n\n`;

    yaml += `replicas:\n`;
    yaml += `  min: ${inference.minReplicas || 1}\n`;
    yaml += `  max: ${inference.maxReplicas || 1}\n\n`;
  }

  // Workbench config
  if (notebookNodes.length > 0) {
    const notebook = notebookNodes[0].data?.helmConfig?.values;
    yaml += `workbench:\n`;
    yaml += `  name: "${notebook.name || 'workbench'}"\n`;
    yaml += `  image: "${notebook.image || ''}"\n`;
    yaml += `  resources:\n`;
    yaml += `    requests:\n`;
    yaml += `      cpu: "${notebook.cpuRequest || '3'}"\n`;
    yaml += `      memory: ${notebook.memoryRequest || '24Gi'}\n`;
    yaml += `    limits:\n`;
    yaml += `      cpu: "${notebook.cpuLimit || '6'}"\n`;
    yaml += `      memory: ${notebook.memoryLimit || '24Gi'}\n`;
    
    if (pvcNodes.length > 0) {
      const pvc = pvcNodes[0].data?.helmConfig?.values;
      yaml += `  pvc:\n`;
      yaml += `    name: "${pvc.name || 'workbench-storage'}"\n`;
      yaml += `    size: "${pvc.size || '20Gi'}"\n`;
      yaml += `    storageClassName: "${pvc.storageClassName || 'gp3-csi'}"\n`;
    }
    
    if (jobNodes.length > 0) {
      const job = jobNodes[0].data?.helmConfig?.values;
      yaml += `  gitRepo:\n`;
      yaml += `    url: "${job.gitRepoUrl || ''}"\n`;
    }
    yaml += `\n`;
  }

  return yaml;
};

/**
 * Generate _helpers.tpl content
 */
export const generateHelpersTemplate = (globals: HelmGlobalValues): string => {
  return `{{/*
Expand the name of the chart.
*/}}
{{- define "${globals.chartName}.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "${globals.chartName}.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "${globals.chartName}.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "${globals.chartName}.labels" -}}
helm.sh/chart: {{ include "${globals.chartName}.chart" . }}
{{ include "${globals.chartName}.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "${globals.chartName}.selectorLabels" -}}
app.kubernetes.io/name: {{ include "${globals.chartName}.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
`;
};

/**
 * Export Helm chart as .tgz archive
 */
export const exportHelmChart = async (
  nodes: NodeData[],
  connections: Connection[],
  globals: HelmGlobalValues
): Promise<Blob> => {
  const zip = new JSZip();
  const chartFolder = zip.folder(globals.chartName);

  if (!chartFolder) {
    throw new Error('Failed to create chart folder');
  }

  // Add Chart.yaml
  chartFolder.file('Chart.yaml', generateChartYaml(globals));

  // Add values.yaml
  chartFolder.file('values.yaml', generateValuesYaml(nodes, globals));

  // Create templates folder
  const templatesFolder = chartFolder.folder('templates');
  if (!templatesFolder) {
    throw new Error('Failed to create templates folder');
  }

  // Add _helpers.tpl
  templatesFolder.file('_helpers.tpl', generateHelpersTemplate(globals));

  // Add template files for each Helm node
  const helmNodes = nodes.filter((node) => node.data?.helmConfig);
  helmNodes.forEach((node) => {
    const resourceType = node.data?.helmConfig?.resourceType;
    const values = node.data?.helmConfig?.values || {};
    
    if (resourceType) {
      const yaml = generateHelmNodeYaml(resourceType, values, globals);
      const filename = `${resourceType}.yaml`;
      templatesFolder.file(filename, yaml);
    }
  });

  // Add NOTES.txt
  const notes = `Thank you for installing ${globals.chartName}!

Your Helm chart has been deployed.

Chart: ${globals.chartName}
Version: ${globals.chartVersion}
Namespace: ${globals.namespace}

To check the status of your deployment:
  kubectl get all -n ${globals.namespace}

Resources created:
${helmNodes.map((n) => `  - ${n.label} (${n.data?.helmConfig?.resourceType})`).join('\n')}
`;
  templatesFolder.file('NOTES.txt', notes);

  // Generate .tgz blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return blob;
};

/**
 * Trigger browser download of the Helm chart
 */
export const downloadHelmChart = async (
  nodes: NodeData[],
  connections: Connection[],
  globals: HelmGlobalValues
): Promise<void> => {
  try {
    const blob = await exportHelmChart(nodes, connections, globals);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${globals.chartName}-${globals.chartVersion}.tgz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download Helm chart:', error);
    throw error;
  }
};
