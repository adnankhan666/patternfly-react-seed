import * as React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from '@patternfly/react-core';
import {
  CopyIcon,
  TrashIcon,
  CloneIcon,
  EditIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onLaunch: (nodeId: string) => void;
}

export const ContextMenu: React.FunctionComponent<ContextMenuProps> = React.memo(({
  x,
  y,
  nodeId,
  onClose,
  onDelete,
  onDuplicate,
  onCopy,
  onEdit,
  onLaunch,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Dropdown
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) onClose();
        }}
        toggle={(toggleRef) => (
          <MenuToggle ref={toggleRef} isExpanded={isOpen} style={{ display: 'none' }} />
        )}
      >
        <DropdownList>
          <DropdownItem
            key="launch"
            icon={<ExternalLinkAltIcon />}
            onClick={() => handleAction(() => onLaunch(nodeId))}
          >
            Launch
          </DropdownItem>
          <DropdownItem
            key="edit"
            icon={<EditIcon />}
            onClick={() => handleAction(() => onEdit(nodeId))}
          >
            Edit Properties
          </DropdownItem>
          <DropdownItem
            key="duplicate"
            icon={<CloneIcon />}
            onClick={() => handleAction(() => onDuplicate(nodeId))}
          >
            Duplicate
          </DropdownItem>
          <DropdownItem
            key="copy"
            icon={<CopyIcon />}
            onClick={() => handleAction(() => onCopy(nodeId))}
          >
            Copy
          </DropdownItem>
          <DropdownItem
            key="delete"
            icon={<TrashIcon />}
            onClick={() => handleAction(() => onDelete(nodeId))}
            className="pf-m-danger"
          >
            Delete
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';
