import React from "react";
import { Button } from "@heroui/button";
import { Navbar, NavbarContent, NavbarItem } from "@heroui/navbar";
import { Icon } from "@iconify/react";

import { ThemeSwitcher } from "@/components/landing/theme-switcher";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  return (
    <Navbar
      isBordered
      className="border-b border-divider bg-background/70 backdrop-blur-md"
      maxWidth="full"
    >
      <NavbarContent className="sm:hidden" justify="start">
        <Button
          isIconOnly
          aria-label="Open menu"
          variant="light"
          onPress={onMenuClick}
        >
          <Icon className="text-xl" icon="lucide:menu" />
        </Button>
      </NavbarContent>

      <NavbarContent justify="start">
        <div className="flex items-center gap-2">
          <span className="font-medium">Personal Project</span>
          <Icon className="text-foreground-500" icon="lucide:chevron-down" />
        </div>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            color="primary"
            size="sm"
            startContent={<Icon icon="lucide:plus" />}
            variant="flat"
          >
            New
          </Button>
        </NavbarItem>

        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>

        <NavbarItem></NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
