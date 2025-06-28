import React from "react";

import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar onMenuClick={toggleSidebar} />

        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute inset-0 dot-pattern opacity-60" />{" "}
          {/* Increased opacity from 50 to 60 for more visible grid */}
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};
