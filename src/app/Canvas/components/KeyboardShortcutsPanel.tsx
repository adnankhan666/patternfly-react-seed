import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';

const SHORTCUTS = [
  { category: 'General', shortcuts: [
    { keys: 'Ctrl/Cmd + S', description: 'Save workflow' },
    { keys: 'Ctrl/Cmd + Z', description: 'Undo' },
    { keys: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
    { keys: 'Ctrl/Cmd + Y', description: 'Redo (alternative)' },
    { keys: 'Escape', description: 'Deselect all / Cancel operation' },
    { keys: '?', description: 'Show keyboard shortcuts' },
  ]},
  { category: 'Nodes', shortcuts: [
    { keys: 'Delete / Backspace', description: 'Delete selected node' },
    { keys: 'Ctrl/Cmd + C', description: 'Copy selected node' },
    { keys: 'Ctrl/Cmd + V', description: 'Paste copied node' },
    { keys: 'Ctrl/Cmd + D', description: 'Duplicate selected node' },
    { keys: 'Ctrl/Cmd + A', description: 'Select all nodes' },
    { keys: 'Tab', description: 'Select next node' },
    { keys: 'Shift + Tab', description: 'Select previous node' },
    { keys: 'Arrow Keys', description: 'Move selected node (1px)' },
    { keys: 'Shift + Arrow Keys', description: 'Move selected node (10px)' },
  ]},
  { category: 'Canvas', shortcuts: [
    { keys: 'Space + Drag', description: 'Pan canvas' },
    { keys: 'Middle Mouse + Drag', description: 'Pan canvas (alternative)' },
    { keys: 'Ctrl/Cmd + Wheel', description: 'Zoom in/out' },
  ]},
];

export const KeyboardShortcutsPanel: React.FunctionComponent = React.memo(() => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      <Button
        variant="plain"
        icon={<QuestionCircleIcon />}
        onClick={handleToggle}
        aria-label="Show keyboard shortcuts"
        title="Keyboard Shortcuts"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      />

      <Modal
        variant={ModalVariant.medium}
        title="Keyboard Shortcuts"
        isOpen={isOpen}
        onClose={handleToggle}
        aria-label="Keyboard shortcuts dialog"
      >
        {SHORTCUTS.map((category) => (
          <div key={category.category} style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
              {category.category}
            </h3>
            <DescriptionList isHorizontal>
              {category.shortcuts.map((shortcut, idx) => (
                <DescriptionListGroup key={idx}>
                  <DescriptionListTerm>
                    <kbd
                      style={{
                        background: '#f5f5f5',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    >
                      {shortcut.keys}
                    </kbd>
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {shortcut.description}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </div>
        ))}
      </Modal>
    </>
  );
});

KeyboardShortcutsPanel.displayName = 'KeyboardShortcutsPanel';
