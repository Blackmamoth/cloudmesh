"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import Link from "next/link";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import { Badge } from "@heroui/badge";

import { Providers } from "../providers";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { authClient } from "@/lib/auth-client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: "lucide:layout-dashboard", path: "/dashboard" },
    { name: "Files", icon: "lucide:folder", path: "/files" },
    { name: "Linked Accounts", icon: "lucide:cloud", path: "/accounts" },
    { name: "Settings", icon: "lucide:settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    return (
      location === path || (path !== "/dashboard" && location.startsWith(path))
    );
  };

  const title = navItems.find((item) => item.path === location)?.name ?? "";

  const { data } = authClient.useSession();

  return (
    <Providers themeProps={{ attribute: "class", defaultTheme: "system" }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar overlay - improved z-index */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed mobile styling and z-index */}
        <motion.aside
          animate={{ x: 0, opacity: 1 }}
          className={`fixed inset-y-0 left-0 z-[60] w-[85%] max-w-[280px] bg-content1 border-r border-divider transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:w-64 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          initial={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 p-4 h-16">
              <Icon className="text-primary text-2xl" icon="lucide:layers" />
              <span className="font-bold text-lg">CloudMesh</span>
              {/* Close button for mobile - more prominent */}
              <Button
                isIconOnly
                className="ml-auto lg:hidden"
                size="sm"
                variant="flat"
                onPress={() => setIsSidebarOpen(false)}
              >
                <Icon className="text-lg" icon="lucide:x" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  as={Link}
                  className="justify-start w-full mb-1"
                  color={isActive(item.path) ? "primary" : "default"}
                  href={item.path}
                  startContent={<Icon className="text-lg" icon={item.icon} />}
                  variant={isActive(item.path) ? "flat" : "light"}
                  onPress={() => setIsSidebarOpen(false)} // Close sidebar on navigation (mobile)
                >
                  {item.name}
                </Button>
              ))}
            </nav>

            {/* Bottom section with avatar dropdown */}
            <div className="p-4 border-t border-divider">
              <div className="flex items-center justify-between mb-4">
                <ThemeSwitcher />
                <Button
                  isIconOnly
                  aria-label="Help"
                  color="default"
                  size="sm"
                  variant="light"
                >
                  <Icon className="text-lg" icon="lucide:help-circle" />
                </Button>
              </div>

              <Dropdown placement="top-end">
                <DropdownTrigger>
                  <Button
                    className="justify-start w-full"
                    color="default"
                    endContent={
                      <Icon className="text-xs" icon="lucide:chevron-up" />
                    }
                    startContent={
                      <Avatar
                        size="sm"
                        src={data?.user.image || ""}
                        fallback={<Icon icon="lucide:user" />}
                      />
                    }
                    variant="light"
                  >
                    {data?.user.name}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User actions">
                  <DropdownItem
                    key="profile"
                    as={Link}
                    description="View and edit your profile"
                    href="/settings"
                    startContent={<Icon icon="lucide:user" />}
                  >
                    Profile
                  </DropdownItem>
                  <DropdownItem
                    key="linked-accounts"
                    as={Link}
                    description="Manage your cloud providers"
                    href="/accounts"
                    startContent={<Icon icon="lucide:cloud" />}
                  >
                    Linked Accounts
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    as={Link}
                    description="App preferences and security"
                    href="/settings"
                    startContent={<Icon icon="lucide:settings" />}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="help"
                    description="Documentation and support"
                    startContent={<Icon icon="lucide:help-circle" />}
                  >
                    Help
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="text-danger"
                    color="danger"
                    startContent={<Icon icon="lucide:log-out" />}
                  >
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </motion.aside>

        {/* Main content - Improved responsive layout */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Top bar with more prominent hamburger menu */}
          <Navbar className="border-b border-divider h-16" maxWidth="full">
            <NavbarContent className="lg:hidden">
              <Button
                isIconOnly
                aria-label="Menu"
                color="default"
                variant="flat"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Icon className="text-xl" icon="lucide:menu" />
              </Button>
            </NavbarContent>

            <NavbarContent>
              <NavbarBrand>
                <h1 className="text-xl font-semibold">{title}</h1>
              </NavbarBrand>
            </NavbarContent>

            <NavbarContent justify="end">
              <div className="hidden sm:flex items-center gap-2">
                <Badge
                  children={
                    <Button isIconOnly aria-label="Sync Status" variant="light">
                      <Icon
                        className="text-lg text-success"
                        icon="lucide:check-circle"
                      />
                    </Button>
                  }
                  color="success"
                  content=""
                  placement="bottom-right"
                  size="sm"
                />
              </div>

              <div className="sm:hidden">
                <Avatar
                  size="sm"
                  src="https://img.heroui.chat/image/avatar?w=200&h=200&u=cloudmesh1"
                />
              </div>
            </NavbarContent>
          </Navbar>

          {/* Page content - Improved responsive padding */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
