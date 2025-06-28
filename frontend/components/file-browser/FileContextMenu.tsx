import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

interface FileContextMenuProps {
  x: number;
  y: number;
  fileId: string | null;
  selectedFiles: string[];
  onClose: () => void;
}

interface ContextMenuItem {
  icon: string;
  label: string;
  action: () => void;
  color?: string;
  divider?: boolean;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  selectedFiles,
  onClose,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const isMultipleSelection = selectedFiles.length > 1;

  // Adjust position if menu would go off screen
  const [position, setPosition] = React.useState({ x, y });

  React.useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuRect.width > windowWidth) {
        adjustedX = windowWidth - menuRect.width - 10;
      }

      if (y + menuRect.height > windowHeight) {
        adjustedY = windowHeight - menuRect.height - 10;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  const menuItems: ContextMenuItem[] = [
    {
      icon: "lucide:eye",
      label: "Preview",
      action: () => {
        onClose();
      },
    },
    {
      icon: "lucide:download",
      label: isMultipleSelection
        ? `Download (${selectedFiles.length})`
        : "Download",
      action: () => {
        onClose();
      },
    },
    {
      icon: "lucide:share-2",
      label: "Share",
      action: () => {
        onClose();
      },
    },
    {
      icon: "lucide:edit-3",
      label: "Rename",
      action: () => {
        onClose();
      },
      divider: true,
    },
    {
      icon: "lucide:copy",
      label: "Copy",
      action: () => {
        onClose();
      },
    },
    {
      icon: "lucide:move",
      label: "Move",
      action: () => {
        onClose();
      },
      divider: true,
    },
    {
      icon: "lucide:star",
      label: "Add to Favorites",
      action: () => {
        onClose();
      },
    },
    {
      icon: "lucide:info",
      label: "Properties",
      action: () => {
        onClose();
      },
      divider: true,
    },
    {
      icon: "lucide:trash-2",
      label: isMultipleSelection
        ? `Delete (${selectedFiles.length})`
        : "Delete",
      action: () => {
        onClose();
      },
      color: "text-danger-500",
    },
  ];

  return (
    <motion.div
      ref={menuRef}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 min-w-[180px] bg-content1/95 backdrop-blur-lg border border-divider rounded-lg shadow-lg py-1 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      style={{ left: position.x, top: position.y }}
      transition={{ duration: 0.1 }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-content2 cursor-pointer ${item.color || "text-foreground"}`}
            role="presentation"
            onClick={item.action}
            onKeyDown={item.action}
          >
            <Icon className="text-lg" icon={item.icon} />
            <span className="text-sm">{item.label}</span>
          </div>
          {item.divider && <div className="h-px bg-divider my-1" />}
        </React.Fragment>
      ))}
    </motion.div>
  );
};
