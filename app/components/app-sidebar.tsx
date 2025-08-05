"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SearchForm } from "./search-form";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  RiScanLine,
  RiUserFollowLine,
  RiCodeSSlashLine,
  RiLoginCircleLine,
  RiLogoutBoxLine,
} from "@remixicon/react";
import Image from "next/image";
import { GalleryVerticalEnd } from "lucide-react";
import { authClient } from "@/lib/auth-client";

// This is sample data.
const data = {
  teams: [
    {
      name: "Cloudmesh",
      logo: "/cloudmesh-logo.svg",
    },
    {
      name: "Acme Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png",
    },
    {
      name: "Evil Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png",
    },
  ],
  navMain: [
    {
      title: "Sections",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: RiScanLine,
        },
        {
          title: "Files",
          url: "/files",
          icon: RiUserFollowLine,
        },
        {
          title: "Linked Accounts",
          url: "/linked-accounts",
          icon: RiLoginCircleLine,
        },
        {
          title: "Trash",
          url: "/trash",
          icon: RiCodeSSlashLine,
        },
      ],
    },
    // {
    //   title: "Other",
    //   url: "#",
    //   items: [
    //     {
    //       title: "Settings",
    //       url: "#",
    //       icon: RiSettings3Line,
    //     },
    //     {
    //       title: "Help Center",
    //       url: "#",
    //       icon: RiLeafLine,
    //     },
    //   ],
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const signOut = () => authClient.signOut()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>

        <SidebarMenuButton size="lg" asChild>
          <div>
            <div className="text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
              <Image src="/cloudmesh-logo.svg" alt="Cloudmesh Logo" width={70} height={70} />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Cloudmesh</span>
              <span className="text-xs">v0.1.0</span>
            </div>
          </div>
        </SidebarMenuButton>

      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/60">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                      isActive={pathname === item.url}
                    >
                      <a href={item.url}>
                        {item.icon && (
                          <item.icon
                            className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                            size={22}
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <hr className="border-t border-border mx-2 -mt-px" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto">
              <RiLogoutBoxLine
                className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                size={22}
                aria-hidden="true"
              />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
