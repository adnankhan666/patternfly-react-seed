import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  NumberInput,
} from '@patternfly/react-core';
import { HelmResourceType } from '../types';

interface HelmConfigFormProps {
  resourceType: HelmResourceType;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export const HelmConfigForm: React.FunctionComponent<HelmConfigFormProps> = ({
  resourceType,
  config,
  onChange,
}) => {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const renderOciSecretForm = () => (
    <>
      <FormGroup label="Secret Name" isRequired fieldId="secret-name">
        <TextInput
          isRequired
          type="text"
          id="secret-name"
          name="secret-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="OCI URI" isRequired fieldId="secret-uri">
        <TextInput
          isRequired
          type="text"
          id="secret-uri"
          name="secret-uri"
          value={config.uri || ''}
          onChange={(_event, value) => updateConfig('uri', value)}
        />
      </FormGroup>
      <FormGroup label="Connection Type" fieldId="connection-type">
        <FormSelect
          value={config.connectionType || 'uri-v1'}
          onChange={(_event, value) => updateConfig('connectionType', value)}
          id="connection-type"
          name="connection-type"
        >
          <FormSelectOption key="uri-v1" value="uri-v1" label="uri-v1" />
          <FormSelectOption key="s3" value="s3" label="S3" />
        </FormSelect>
      </FormGroup>
    </>
  );

  const renderServingRuntimeForm = () => (
    <>
      <FormGroup label="Runtime Name" isRequired fieldId="runtime-name">
        <TextInput
          isRequired
          type="text"
          id="runtime-name"
          name="runtime-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="Image Repository" isRequired fieldId="image-repo">
        <TextInput
          isRequired
          type="text"
          id="image-repo"
          name="image-repo"
          value={config.imageRepo || ''}
          onChange={(_event, value) => updateConfig('imageRepo', value)}
        />
      </FormGroup>
      <FormGroup label="Image Tag" isRequired fieldId="image-tag">
        <TextInput
          isRequired
          type="text"
          id="image-tag"
          name="image-tag"
          value={config.imageTag || ''}
          onChange={(_event, value) => updateConfig('imageTag', value)}
        />
      </FormGroup>
      <FormGroup label="Port" fieldId="port">
        <NumberInput
          value={config.port || 8080}
          onMinus={() => updateConfig('port', (config.port || 8080) - 1)}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('port', Number(value));
          }}
          onPlus={() => updateConfig('port', (config.port || 8080) + 1)}
          inputName="port"
          inputAriaLabel="port"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={1}
          max={65535}
        />
      </FormGroup>
      <FormGroup label="Runtime Version" fieldId="runtime-version">
        <TextInput
          type="text"
          id="runtime-version"
          name="runtime-version"
          value={config.runtimeVersion || ''}
          onChange={(_event, value) => updateConfig('runtimeVersion', value)}
        />
      </FormGroup>
    </>
  );

  const renderInferenceServiceForm = () => (
    <>
      <FormGroup label="Model Name" isRequired fieldId="model-name">
        <TextInput
          isRequired
          type="text"
          id="model-name"
          name="model-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="Model Format" fieldId="model-format">
        <FormSelect
          value={config.modelFormat || 'vLLM'}
          onChange={(_event, value) => updateConfig('modelFormat', value)}
          id="model-format"
          name="model-format"
        >
          <FormSelectOption key="vllm" value="vLLM" label="vLLM" />
          <FormSelectOption key="pytorch" value="PyTorch" label="PyTorch" />
          <FormSelectOption key="tensorflow" value="TensorFlow" label="TensorFlow" />
          <FormSelectOption key="onnx" value="ONNX" label="ONNX" />
        </FormSelect>
      </FormGroup>
      <FormGroup label="Storage URI" isRequired fieldId="storage-uri">
        <TextInput
          isRequired
          type="text"
          id="storage-uri"
          name="storage-uri"
          value={config.storageUri || ''}
          onChange={(_event, value) => updateConfig('storageUri', value)}
        />
      </FormGroup>
      <FormGroup label="CPU Request" fieldId="cpu-request">
        <TextInput
          type="text"
          id="cpu-request"
          name="cpu-request"
          value={config.cpuRequest || '4'}
          onChange={(_event, value) => updateConfig('cpuRequest', value)}
        />
      </FormGroup>
      <FormGroup label="Memory Request" fieldId="memory-request">
        <TextInput
          type="text"
          id="memory-request"
          name="memory-request"
          value={config.memoryRequest || '8Gi'}
          onChange={(_event, value) => updateConfig('memoryRequest', value)}
        />
      </FormGroup>
      <FormGroup label="GPU Request" fieldId="gpu-request">
        <NumberInput
          value={config.gpuRequest || 1}
          onMinus={() => updateConfig('gpuRequest', Math.max(0, (config.gpuRequest || 1) - 1))}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('gpuRequest', Number(value));
          }}
          onPlus={() => updateConfig('gpuRequest', (config.gpuRequest || 1) + 1)}
          inputName="gpu-request"
          inputAriaLabel="gpu request"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={0}
          max={16}
        />
      </FormGroup>
      <FormGroup label="CPU Limit" fieldId="cpu-limit">
        <TextInput
          type="text"
          id="cpu-limit"
          name="cpu-limit"
          value={config.cpuLimit || '8'}
          onChange={(_event, value) => updateConfig('cpuLimit', value)}
        />
      </FormGroup>
      <FormGroup label="Memory Limit" fieldId="memory-limit">
        <TextInput
          type="text"
          id="memory-limit"
          name="memory-limit"
          value={config.memoryLimit || '10Gi'}
          onChange={(_event, value) => updateConfig('memoryLimit', value)}
        />
      </FormGroup>
      <FormGroup label="GPU Limit" fieldId="gpu-limit">
        <NumberInput
          value={config.gpuLimit || 1}
          onMinus={() => updateConfig('gpuLimit', Math.max(0, (config.gpuLimit || 1) - 1))}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('gpuLimit', Number(value));
          }}
          onPlus={() => updateConfig('gpuLimit', (config.gpuLimit || 1) + 1)}
          inputName="gpu-limit"
          inputAriaLabel="gpu limit"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={0}
          max={16}
        />
      </FormGroup>
      <FormGroup label="Min Replicas" fieldId="min-replicas">
        <NumberInput
          value={config.minReplicas || 1}
          onMinus={() => updateConfig('minReplicas', Math.max(0, (config.minReplicas || 1) - 1))}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('minReplicas', Number(value));
          }}
          onPlus={() => updateConfig('minReplicas', (config.minReplicas || 1) + 1)}
          inputName="min-replicas"
          inputAriaLabel="min replicas"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={0}
          max={10}
        />
      </FormGroup>
      <FormGroup label="Max Replicas" fieldId="max-replicas">
        <NumberInput
          value={config.maxReplicas || 1}
          onMinus={() => updateConfig('maxReplicas', Math.max(1, (config.maxReplicas || 1) - 1))}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('maxReplicas', Number(value));
          }}
          onPlus={() => updateConfig('maxReplicas', (config.maxReplicas || 1) + 1)}
          inputName="max-replicas"
          inputAriaLabel="max replicas"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={1}
          max={10}
        />
      </FormGroup>
    </>
  );

  const renderPvcForm = () => (
    <>
      <FormGroup label="PVC Name" isRequired fieldId="pvc-name">
        <TextInput
          isRequired
          type="text"
          id="pvc-name"
          name="pvc-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="Size" isRequired fieldId="pvc-size">
        <TextInput
          isRequired
          type="text"
          id="pvc-size"
          name="pvc-size"
          value={config.size || '20Gi'}
          onChange={(_event, value) => updateConfig('size', value)}
          placeholder="e.g., 20Gi"
        />
      </FormGroup>
      <FormGroup label="Storage Class" fieldId="storage-class">
        <TextInput
          type="text"
          id="storage-class"
          name="storage-class"
          value={config.storageClassName || ''}
          onChange={(_event, value) => updateConfig('storageClassName', value)}
        />
      </FormGroup>
      <FormGroup label="Access Mode" fieldId="access-mode">
        <FormSelect
          value={config.accessMode || 'ReadWriteOnce'}
          onChange={(_event, value) => updateConfig('accessMode', value)}
          id="access-mode"
          name="access-mode"
        >
          <FormSelectOption key="rwo" value="ReadWriteOnce" label="ReadWriteOnce" />
          <FormSelectOption key="rwm" value="ReadWriteMany" label="ReadWriteMany" />
          <FormSelectOption key="rom" value="ReadOnlyMany" label="ReadOnlyMany" />
        </FormSelect>
      </FormGroup>
    </>
  );

  const renderRbacForm = () => (
    <>
      <FormGroup label="Service Account Name" isRequired fieldId="sa-name">
        <TextInput
          isRequired
          type="text"
          id="sa-name"
          name="sa-name"
          value={config.serviceAccountName || ''}
          onChange={(_event, value) => updateConfig('serviceAccountName', value)}
        />
      </FormGroup>
      <FormGroup label="Role Name" fieldId="role-name">
        <TextInput
          type="text"
          id="role-name"
          name="role-name"
          value={config.roleName || ''}
          onChange={(_event, value) => updateConfig('roleName', value)}
        />
      </FormGroup>
      <FormGroup label="Rules Summary" fieldId="rules-summary">
        <TextInput
          type="text"
          id="rules-summary"
          name="rules-summary"
          value="pods (get, list), pods/exec (create)"
          isDisabled
        />
      </FormGroup>
    </>
  );

  const renderNotebookForm = () => (
    <>
      <FormGroup label="Notebook Name" isRequired fieldId="notebook-name">
        <TextInput
          isRequired
          type="text"
          id="notebook-name"
          name="notebook-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="Image" isRequired fieldId="notebook-image">
        <TextInput
          isRequired
          type="text"
          id="notebook-image"
          name="notebook-image"
          value={config.image || ''}
          onChange={(_event, value) => updateConfig('image', value)}
        />
      </FormGroup>
      <FormGroup label="CPU Request" fieldId="nb-cpu-request">
        <TextInput
          type="text"
          id="nb-cpu-request"
          name="nb-cpu-request"
          value={config.cpuRequest || '3'}
          onChange={(_event, value) => updateConfig('cpuRequest', value)}
        />
      </FormGroup>
      <FormGroup label="Memory Request" fieldId="nb-memory-request">
        <TextInput
          type="text"
          id="nb-memory-request"
          name="nb-memory-request"
          value={config.memoryRequest || '24Gi'}
          onChange={(_event, value) => updateConfig('memoryRequest', value)}
        />
      </FormGroup>
      <FormGroup label="CPU Limit" fieldId="nb-cpu-limit">
        <TextInput
          type="text"
          id="nb-cpu-limit"
          name="nb-cpu-limit"
          value={config.cpuLimit || '6'}
          onChange={(_event, value) => updateConfig('cpuLimit', value)}
        />
      </FormGroup>
      <FormGroup label="Memory Limit" fieldId="nb-memory-limit">
        <TextInput
          type="text"
          id="nb-memory-limit"
          name="nb-memory-limit"
          value={config.memoryLimit || '24Gi'}
          onChange={(_event, value) => updateConfig('memoryLimit', value)}
        />
      </FormGroup>
      <FormGroup label="PVC Name" fieldId="pvc-name-ref">
        <TextInput
          type="text"
          id="pvc-name-ref"
          name="pvc-name-ref"
          value={config.pvcName || ''}
          onChange={(_event, value) => updateConfig('pvcName', value)}
        />
      </FormGroup>
    </>
  );

  const renderJobForm = () => (
    <>
      <FormGroup label="Job Name" isRequired fieldId="job-name">
        <TextInput
          isRequired
          type="text"
          id="job-name"
          name="job-name"
          value={config.name || ''}
          onChange={(_event, value) => updateConfig('name', value)}
        />
      </FormGroup>
      <FormGroup label="Git Repository URL" isRequired fieldId="git-repo-url">
        <TextInput
          isRequired
          type="text"
          id="git-repo-url"
          name="git-repo-url"
          value={config.gitRepoUrl || ''}
          onChange={(_event, value) => updateConfig('gitRepoUrl', value)}
        />
      </FormGroup>
      <FormGroup label="Notebook Name Reference" fieldId="notebook-name-ref">
        <TextInput
          type="text"
          id="notebook-name-ref"
          name="notebook-name-ref"
          value={config.notebookName || ''}
          onChange={(_event, value) => updateConfig('notebookName', value)}
        />
      </FormGroup>
      <FormGroup label="Backoff Limit" fieldId="backoff-limit">
        <NumberInput
          value={config.backoffLimit || 3}
          onMinus={() => updateConfig('backoffLimit', Math.max(0, (config.backoffLimit || 3) - 1))}
          onChange={(event) => {
            const value = (event.target as HTMLInputElement).value;
            updateConfig('backoffLimit', Number(value));
          }}
          onPlus={() => updateConfig('backoffLimit', (config.backoffLimit || 3) + 1)}
          inputName="backoff-limit"
          inputAriaLabel="backoff limit"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={0}
          max={10}
        />
      </FormGroup>
    </>
  );

  return (
    <Form>
      {resourceType === 'oci-secret' && renderOciSecretForm()}
      {resourceType === 'serving-runtime' && renderServingRuntimeForm()}
      {resourceType === 'inference-service' && renderInferenceServiceForm()}
      {resourceType === 'pvc' && renderPvcForm()}
      {resourceType === 'rbac' && renderRbacForm()}
      {resourceType === 'notebook' && renderNotebookForm()}
      {resourceType === 'job' && renderJobForm()}
    </Form>
  );
};
