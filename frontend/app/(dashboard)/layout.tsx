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
import { useRouter } from "next/navigation";
import { Providers } from "../providers";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { authClient } from "@/lib/auth-client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const navItems = [
    { name: "Dashboard", icon: "lucide:layout-dashboard", path: "/dashboard" },
    { name: "Files", icon: "lucide:folder", path: "/files" },
    { name: "Trash", icon: "lucide:trash", path: "/trash" },
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
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Now collapsible on all screen sizes */}
        <motion.aside
          animate={{ 
            width: isSidebarOpen ? "16rem" : "0rem",
            opacity: isSidebarOpen ? 1 : 0 
          }}
          className={`fixed inset-y-0 left-0 z-[60] bg-content1 border-r border-divider overflow-hidden xl:relative xl:z-auto ${
            isSidebarOpen 
              ? "w-64 xl:w-64" 
              : "w-0 xl:w-0"
          }`}
          initial={false}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex flex-col h-full w-64">
            {/* Logo */}
            <div className="flex items-center gap-2 p-4 h-16 min-w-0">
              <Icon className="text-primary text-2xl flex-shrink-0" icon="lucide:layers" />
              <span className="font-bold text-lg truncate">CloudMesh</span>
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
                  startContent={<Icon className="text-lg flex-shrink-0" icon={item.icon} />}
                  variant={isActive(item.path) ? "flat" : "light"}
                  onPress={() => {
                    // Close sidebar on mobile/tablet navigation
                    if (window.innerWidth < 1280) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <span className="truncate">{item.name}</span>
                </Button>
              ))}
            </nav>

            {/* Bottom section with avatar dropdown */}
            <div className="p-4 border-t border-divider">

              <Dropdown placement="top-end">
                <DropdownTrigger>
                  <Button
                    className="justify-start w-full"
                    color="default"
                    endContent={
                      <Icon className="text-xs flex-shrink-0" icon="lucide:chevron-up" />
                    }
                    startContent={
                      <Avatar
                        size="sm"
                        src={data?.user.image || ""}
                        fallback={<Icon icon="lucide:user" />}
                        className="flex-shrink-0"
                      />
                    }
                    variant="light"
                  >
                    <span className="truncate">{data?.user.name}</span>
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
                    key="logout"
                    className="text-danger"
                    color="danger"
                    startContent={<Icon icon="lucide:log-out" />}
                    onPress={async () => {
                      await authClient.signOut();
                      router.push("/")                      
                    }}
                  >
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </motion.aside>

        {/* Main content - Now properly responsive to sidebar state */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar with sidebar toggle button */}
          <Navbar className="border-b border-divider h-16" maxWidth="full">
            <NavbarContent>
              <NavbarBrand className="flex items-center gap-3">
                <Button
                  isIconOnly
                  aria-label="Toggle sidebar"
                  size="sm"
                  variant="light"
                  onPress={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Icon 
                    className="text-lg" 
                    icon={isSidebarOpen ? "lucide:panel-left-close" : "lucide:panel-left-open"} 
                  />
                </Button>
                <h1 className="text-xl font-semibold truncate">{title}</h1>
              </NavbarBrand>
            </NavbarContent>
            <NavbarContent justify="end">
              <ThemeSwitcher />
            </NavbarContent>
          </Navbar>

          {/* Page content - Improved responsive padding and width handling */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
