import React from "react";
import { Icon } from "@iconify/react";
import { Drawer, DrawerContent, DrawerBody } from "@heroui/drawer";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
}

const navItems: NavItem[] = [
  { icon: "lucide:layout-dashboard", label: "Dashboard", href: "/dashboard" },
  {
    icon: "lucide:file",
    label: "Files",
    href: "/dashboard/files",
  },
  {
    icon: "lucide:link",
    label: "Linked Accounts",
    href: "/dashboard/linked-accounts",
  },
  { icon: "lucide:folder", label: "Projects", href: "/dashboard/projects" },
  { icon: "lucide:settings", label: "Settings", href: "/dashboard/settings" },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-6">
        <div className="bg-primary-500 p-1.5 rounded-md">
          <Icon className="text-white text-xl" icon="lucide:layers" />
        </div>
        <p className="font-bold text-xl">CloudMesh</p>
      </div>

      <div className="mt-2 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors ${
              item.isActive
                ? "bg-primary-500/10 text-primary-500"
                : "text-foreground-600 hover:bg-content2/50 hover:text-foreground"
            }`}
            href={item.href}
          >
            <Icon className="text-xl" icon={item.icon} />
            <span className="font-medium text-sm">{item.label}</span>
            {pathname === item.href && (
              <motion.div
                className="w-1 h-5 bg-primary-500 rounded-full ml-auto"
                layoutId="activeIndicator"
              />
            )}
          </Link>
        ))}
      </div>

      <div className="mt-auto px-3 py-4">
        <div className="bg-content2/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary-500/10 rounded-md">
              <Icon className="text-primary-500" icon="lucide:zap" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Free Plan</h4>
              <p className="text-xs text-foreground-500">5 GB of 15 GB used</p>
            </div>
          </div>
          <Button className="w-full" color="primary" size="sm" variant="flat">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-content1 border-r border-divider">
        {sidebarContent}
      </div>

      {/* Mobile sidebar (drawer) */}
      <Drawer isOpen={isOpen} placement="left" size="xs" onClose={onClose}>
        <DrawerContent>
          {() => <DrawerBody className="p-0">{sidebarContent}</DrawerBody>}
        </DrawerContent>
      </Drawer>
    </>
  );
};
