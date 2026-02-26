import * as React from 'react';
import {
  Modal,
  ModalVariant,
  ModalBody,
  Button,
  Form,
  FormGroup,
  TextArea,
  Alert,
} from '@patternfly/react-core';

interface ClusterConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (kubeconfig: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  clusterName: string | null;
}

function parseClusterName(kubeconfigStr: string): string | null {
  try {
    // Try to extract current-context cluster name from plain YAML
    const contextMatch = kubeconfigStr.match(/current-context:\s*['"]?([^\n'"]+)['"]?/);
    if (contextMatch) return contextMatch[1].trim();
  } catch {
    // ignore
  }
  return 'cluster';
}

function validateKubeconfig(value: string): string | null {
  if (!value.trim()) return 'Kubeconfig cannot be empty';
  if (!value.includes('apiVersion')) return 'Does not look like a valid kubeconfig (missing apiVersion)';
  if (!value.includes('clusters')) return 'Does not look like a valid kubeconfig (missing clusters)';
  if (!value.includes('users')) return 'Does not look like a valid kubeconfig (missing users)';
  if (!value.includes('contexts')) return 'Does not look like a valid kubeconfig (missing contexts)';
  return null;
}

export const ClusterConnect: React.FunctionComponent<ClusterConnectProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  isConnected,
  clusterName,
}) => {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleConnect = () => {
    const validationError = validateKubeconfig(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onConnect(value);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setValue(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDisconnect = () => {
    setValue('');
    setError(null);
    onDisconnect();
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={isConnected ? 'Cluster Connected' : 'Connect to Cluster'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalBody>
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 16px', background: '#f0fdf4',
              border: '1px solid #86efac', borderRadius: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <div>
                <div style={{ fontWeight: 600, color: '#166534' }}>Connected</div>
                <div style={{ fontSize: '13px', color: '#15803d' }}>{clusterName}</div>
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Your kubeconfig is active for this session only. It is never stored on the server.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="danger" onClick={handleDisconnect}>Disconnect</Button>
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Paste your kubeconfig below or upload the file. It is sent only when you click
              "Deploy to Cluster" and is never stored on the server.
            </p>

            {error && <Alert variant="danger" isInline title={error} />}

            <Form>
              <FormGroup label="Kubeconfig" fieldId="kubeconfig-input" isRequired>
                <TextArea
                  id="kubeconfig-input"
                  value={value}
                  onChange={(_e, val) => { setValue(val); setError(null); }}
                  placeholder="Paste kubeconfig YAML here..."
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </FormGroup>
            </Form>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button variant="primary" onClick={handleConnect} isDisabled={!value.trim()}>
                Connect
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload file
              </Button>
              <Button variant="link" onClick={onClose}>Cancel</Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml,.conf,.json,.kubeconfig,*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

ClusterConnect.displayName = 'ClusterConnect';

export { parseClusterName };
