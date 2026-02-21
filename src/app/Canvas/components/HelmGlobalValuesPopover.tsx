import * as React from 'react';
import {
  Popover,
  Form,
  FormGroup,
  TextInput,
  Button,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { HelmGlobalValues } from '../types';

interface HelmGlobalValuesPopoverProps {
  values: HelmGlobalValues;
  onChange: (values: HelmGlobalValues) => void;
  children: React.ReactElement;
}

const validateNamespace = (namespace: string): string | null => {
  if (!namespace) return 'Namespace is required';
  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(namespace)) {
    return 'Must be lowercase alphanumeric with hyphens';
  }
  if (namespace.length > 63) return 'Must be 63 characters or less';
  return null;
};

const validateChartName = (name: string): string | null => {
  if (!name) return 'Chart name is required';
  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
    return 'Must be lowercase alphanumeric with hyphens';
  }
  return null;
};

const validateVersion = (version: string): string | null => {
  if (!version) return 'Version is required';
  // Simplified semver validation
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
    return 'Must be valid semver (e.g., 1.0.0)';
  }
  return null;
};

export const HelmGlobalValuesPopover: React.FunctionComponent<HelmGlobalValuesPopoverProps> = ({
  values,
  onChange,
  children,
}) => {
  const [localValues, setLocalValues] = React.useState<HelmGlobalValues>(values);
  const [errors, setErrors] = React.useState<Record<string, string | null>>({
    namespace: null,
    chartName: null,
    chartVersion: null,
    appVersion: null,
  });

  const handleChange = (field: keyof HelmGlobalValues, value: string) => {
    const newValues = { ...localValues, [field]: value };
    setLocalValues(newValues);

    // Validate on change
    let error: string | null = null;
    if (field === 'namespace') {
      error = validateNamespace(value);
    } else if (field === 'chartName') {
      error = validateChartName(value);
    } else if (field === 'chartVersion') {
      error = validateVersion(value);
    } else if (field === 'appVersion') {
      error = value ? null : 'App version is required';
    }

    setErrors({ ...errors, [field]: error });
  };

  const handleApply = () => {
    // Validate all fields before applying
    const newErrors = {
      namespace: validateNamespace(localValues.namespace),
      chartName: validateChartName(localValues.chartName),
      chartVersion: validateVersion(localValues.chartVersion),
      appVersion: localValues.appVersion ? null : 'App version is required',
    };

    setErrors(newErrors);

    // Only apply if no errors
    const hasErrors = Object.values(newErrors).some((error) => error !== null);
    if (!hasErrors) {
      onChange(localValues);
    }
  };

  const bodyContent = (
    <div style={{ width: '400px' }}>
      <Form>
        <FormGroup label="Namespace" isRequired fieldId="helm-namespace">
          <TextInput
            isRequired
            type="text"
            id="helm-namespace"
            name="helm-namespace"
            value={localValues.namespace}
            onChange={(_event, value) => handleChange('namespace', value)}
            validated={errors.namespace ? 'error' : 'default'}
          />
          {errors.namespace && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{errors.namespace}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Kubernetes namespace for deployment</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        <FormGroup label="Chart Name" isRequired fieldId="helm-chart-name">
          <TextInput
            isRequired
            type="text"
            id="helm-chart-name"
            name="helm-chart-name"
            value={localValues.chartName}
            onChange={(_event, value) => handleChange('chartName', value)}
            validated={errors.chartName ? 'error' : 'default'}
          />
          {errors.chartName && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{errors.chartName}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Name of the Helm chart</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        <FormGroup label="Chart Version" isRequired fieldId="helm-chart-version">
          <TextInput
            isRequired
            type="text"
            id="helm-chart-version"
            name="helm-chart-version"
            value={localValues.chartVersion}
            onChange={(_event, value) => handleChange('chartVersion', value)}
            validated={errors.chartVersion ? 'error' : 'default'}
          />
          {errors.chartVersion && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{errors.chartVersion}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Semantic version (e.g., 1.0.0)</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        <FormGroup label="App Version" isRequired fieldId="helm-app-version">
          <TextInput
            isRequired
            type="text"
            id="helm-app-version"
            name="helm-app-version"
            value={localValues.appVersion}
            onChange={(_event, value) => handleChange('appVersion', value)}
          />
          {errors.appVersion && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{errors.appVersion}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Version of the application being deployed</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </Form>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="primary" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      aria-label="Helm global values"
      headerContent={<div>Helm Global Values</div>}
      bodyContent={bodyContent}
      position="bottom"
      enableFlip
    >
      {children}
    </Popover>
  );
};
