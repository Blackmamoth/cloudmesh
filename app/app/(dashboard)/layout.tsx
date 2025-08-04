import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden px-4 md:px-6 lg:px-8">
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default RootLayout;
