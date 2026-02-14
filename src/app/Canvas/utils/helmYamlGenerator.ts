import { HelmGlobalValues } from '../types';

/**
 * Generate OCI Secret YAML (connection-secret.yaml)
 */
export const generateSecretYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-large-v3-oci';
  const uri = config.uri || 'oci://quay.io/redhat-ai-services/modelcar-catalog:whisper-large-v3';
  const connectionType = config.connectionType || 'uri-v1';

  return `apiVersion: v1
kind: Secret
metadata:
  name: ${name}
  namespace: ${globals.namespace}
  annotations:
    opendatahub.io/connection-type-ref: ${connectionType}
type: Opaque
stringData:
  URI: "${uri}"`;
};

/**
 * Generate ServingRuntime YAML (servingruntime.yaml)
 */
export const generateServingRuntimeYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-large-v3';
  const imageRepo = config.imageRepo || 'quay.io/vllm/vllm-cuda';
  const imageTag = config.imageTag || '0.9.2.2';
  const imagePullPolicy = config.imagePullPolicy || 'IfNotPresent';
  const port = config.port || 8080;
  const runtimeVersion = config.runtimeVersion || 'v0.9.2.2';

  return `apiVersion: serving.kserve.io/v1alpha1
kind: ServingRuntime
metadata:
  name: ${name}
  namespace: ${globals.namespace}
  labels:
    opendatahub.io/dashboard: "true"
  annotations:
    opendatahub.io/runtime-version: ${runtimeVersion}
    opendatahub.io/accelerator-name: "nvidia"
    openshift.io/display-name: "${name}"
    opendatahub.io/template-display-name: "vLLM ${runtimeVersion} NVIDIA GPU ServingRuntime for KServe"
    opendatahub.io/recommended-accelerators: '["nvidia.com/gpu"]'
    opendatahub.io/apiProtocol: REST
spec:
  annotations:
    prometheus.io/path: /metrics
    prometheus.io/port: "${port}"
  containers:
  - name: kserve-container
    image: "${imageRepo}:${imageTag}"
    imagePullPolicy: ${imagePullPolicy}
    command: ["python","-m","vllm.entrypoints.openai.api_server"]
    args:
    - "--port=${port}"
    - "--model=/mnt/models"
    - "--served-model-name=${name}"
    env:
    - name: HF_HOME
      value: /tmp/hf_home
    ports:
    - containerPort: ${port}
      protocol: TCP
    volumeMounts:
    - name: shm
      mountPath: /dev/shm
  multiModel: false
  supportedModelFormats:
  - name: vLLM
    autoSelect: true
  volumes:
  - name: shm
    emptyDir:
      medium: Memory
      sizeLimit: 2Gi`;
};

/**
 * Generate InferenceService YAML (inferenceservice.yaml)
 */
export const generateInferenceServiceYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-large-v3';
  const runtime = config.runtime || name;
  const modelFormat = config.modelFormat || 'vLLM';
  const storageUri = config.storageUri || 'oci://quay.io/redhat-ai-services/modelcar-catalog:whisper-large-v3';
  const cpuRequest = config.cpuRequest || '4';
  const memoryRequest = config.memoryRequest || '8Gi';
  const gpuRequest = config.gpuRequest || '1';
  const cpuLimit = config.cpuLimit || '8';
  const memoryLimit = config.memoryLimit || '10Gi';
  const gpuLimit = config.gpuLimit || '1';
  const minReplicas = config.minReplicas || 1;
  const maxReplicas = config.maxReplicas || 1;
  const tolerations = config.tolerations || [
    {
      key: 'nvidia.com/gpu',
      operator: 'Exists',
      effect: 'NoSchedule',
    },
  ];

  const tolerationsYaml = tolerations
    .map((t: any) => `      - key: "${t.key}"
        operator: "${t.operator}"
        effect: "${t.effect}"`)
    .join('\n');

  return `apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: ${name}
  namespace: ${globals.namespace}
  annotations:
    serving.kserve.io/deploymentMode: RawDeployment
spec:
  predictor:
    automountServiceAccountToken: false
    minReplicas: ${minReplicas}
    maxReplicas: ${maxReplicas}
    model:
      runtime: ${runtime}
      modelFormat:
        name: ${modelFormat}
      storageUri: "${storageUri}"
      resources:
        requests:
          cpu: "${cpuRequest}"
          memory: "${memoryRequest}"
          nvidia.com/gpu: "${gpuRequest}"
        limits:
          cpu: "${cpuLimit}"
          memory: "${memoryLimit}"
          nvidia.com/gpu: "${gpuLimit}"
    tolerations:
${tolerationsYaml}`;
};

/**
 * Generate PVC YAML (workbench-pvc.yaml)
 */
export const generatePvcYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-workbench-storage';
  const size = config.size || '20Gi';
  const storageClassName = config.storageClassName || 'gp3-csi';
  const accessMode = config.accessMode || 'ReadWriteOnce';
  const displayName = config.displayName || `${name}-storage`;

  return `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${name}
  namespace: ${globals.namespace}
  annotations:
    openshift.io/display-name: "${displayName}"
spec:
  accessModes: ["${accessMode}"]
  resources:
    requests:
      storage: "${size}"
  storageClassName: "${storageClassName}"
  volumeMode: Filesystem`;
};

/**
 * Generate RBAC YAML (workbench-rbac.yaml)
 */
export const generateRbacYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const serviceAccountName = config.serviceAccountName || 'whisper-workbench';
  const roleName = config.roleName || `${serviceAccountName}-pod-exec`;
  const roleBindingName = config.roleBindingName || `${serviceAccountName}-exec`;

  return `apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${serviceAccountName}
  namespace: ${globals.namespace}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${roleName}
  namespace: ${globals.namespace}
  annotations:
    argocd.argoproj.io/sync-wave: "0"
rules:
  # Read pods so the job can find the notebook pod
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
  # Exec into the notebook pod (subresource requires 'create')
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ${roleBindingName}
  namespace: ${globals.namespace}
  annotations:
    argocd.argoproj.io/sync-wave: "0"
subjects:
  - kind: ServiceAccount
    name: ${serviceAccountName}
    namespace: ${globals.namespace}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ${roleName}`;
};

/**
 * Generate Notebook YAML (workbench-notebook.yaml)
 */
export const generateNotebookYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-workbench';
  const image = config.image || 'image-registry.openshift-image-registry.svc:5000/redhat-ods-applications/s2i-generic-data-science-notebook:2025.1';
  const cpuRequest = config.cpuRequest || '3';
  const memoryRequest = config.memoryRequest || '24Gi';
  const cpuLimit = config.cpuLimit || '6';
  const memoryLimit = config.memoryLimit || '24Gi';
  const pvcName = config.pvcName || 'whisper-workbench-storage';
  const serviceAccountName = config.serviceAccountName || name;
  const clusterDomainUrl = config.clusterDomainUrl || '';

  let tornadoSettings = '';
  if (clusterDomainUrl) {
    tornadoSettings = `
                --ServerApp.tornado_settings={"user":"admin","hub_host":"https://rhods-dashboard-redhat-ods-applications.apps.${clusterDomainUrl}","hub_prefix":"/projects/${globals.namespace}"}`;
  }

  return `apiVersion: kubeflow.org/v1
kind: Notebook
metadata:
  name: ${name}
  namespace: ${globals.namespace}
  annotations:
    notebooks.opendatahub.io/inject-oauth: "true"
    opendatahub.io/image-display-name: Standard Data Science
    notebooks.opendatahub.io/last-image-selection: 's2i-generic-data-science-notebook:2025.1'
    notebooks.opendatahub.io/last-image-version-git-commit-selection: '2e70684'
spec:
  template:
    spec:
      serviceAccountName: ${serviceAccountName}
      containers:
      - name: ${name}
        image: "${image}"
        imagePullPolicy: Always
        resources:
          requests:
            cpu: "${cpuRequest}"
            memory: "${memoryRequest}"
          limits:
            cpu: "${cpuLimit}"
            memory: "${memoryLimit}"
        workingDir: /opt/app-root/src
        env:
        - name: NOTEBOOK_ARGS
          value: |-
            --ServerApp.port=8888
                --ServerApp.token=''
                --ServerApp.password=''
                --ServerApp.base_url=/notebook/${globals.namespace}/${name}
                --ServerApp.quit_button=False${tornadoSettings}
        - name: JUPYTER_IMAGE
          value: "${image}"
        volumeMounts:
        - name: workbench-pvc
          mountPath: /opt/app-root/src
      volumes:
      - name: workbench-pvc
        persistentVolumeClaim:
          claimName: ${pvcName}`;
};

/**
 * Generate Job YAML (workbench-clone-job.yaml)
 */
export const generateJobYaml = (config: Record<string, any>, globals: HelmGlobalValues): string => {
  const name = config.name || 'whisper-workbench-clone-repo';
  const gitRepoUrl = config.gitRepoUrl || 'https://github.com/Sheryl-shiyi/Basic-speech-to-text-with-Whisper.git';
  const notebookName = config.notebookName || 'whisper-workbench';
  const serviceAccountName = config.serviceAccountName || notebookName;
  const backoffLimit = config.backoffLimit || 3;

  return `apiVersion: batch/v1
kind: Job
metadata:
  name: ${name}
  namespace: ${globals.namespace}
spec:
  backoffLimit: ${backoffLimit}
  template:
    spec:
      serviceAccountName: ${serviceAccountName}
      initContainers:
      - name: wait-for-workbench
        image: image-registry.openshift-image-registry.svc:5000/openshift/tools:latest
        command: ["/bin/bash"]
        args:
        - -ec
        - |
          echo "Waiting for workbench pod..."
          while [ -z "$(oc get pods -n ${globals.namespace} -l notebook-name=${notebookName} -o jsonpath='{.items[0].status.phase}' 2>/dev/null | grep Running)" ]; do
            sleep 2
          done
          echo "Workbench pod is running."
      containers:
      - name: git-clone
        image: image-registry.openshift-image-registry.svc:5000/openshift/tools:latest
        command: ["/bin/bash"]
        args:
        - -ec
        - |
          POD_NAME=$(oc get pods -n ${globals.namespace} -l notebook-name=${notebookName} -o jsonpath='{.items[0].metadata.name}')
          oc exec -n ${globals.namespace} $POD_NAME -- bash -c "cd /opt/app-root/src && git clone ${gitRepoUrl}"
      restartPolicy: Never`;
};

/**
 * Generate all YAML for a Helm node
 */
export const generateHelmNodeYaml = (
  resourceType: string,
  config: Record<string, any>,
  globals: HelmGlobalValues
): string => {
  switch (resourceType) {
    case 'oci-secret':
      return generateSecretYaml(config, globals);
    case 'serving-runtime':
      return generateServingRuntimeYaml(config, globals);
    case 'inference-service':
      return generateInferenceServiceYaml(config, globals);
    case 'pvc':
      return generatePvcYaml(config, globals);
    case 'rbac':
      return generateRbacYaml(config, globals);
    case 'notebook':
      return generateNotebookYaml(config, globals);
    case 'job':
      return generateJobYaml(config, globals);
    default:
      return '# Unknown resource type';
  }
};
