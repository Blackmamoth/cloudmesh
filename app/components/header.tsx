"use client";
import React, {memo} from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import FeedbackDialog from "./feedback-dialog";
import UserDropdown from "./user-dropdown";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { RiScanLine } from "@remixicon/react";
import { usePathname } from "next/navigation";
const Header = () => {
  const pathname = usePathname();
  const pathnameArray = pathname.split("/");
  const pageName = pathnameArray[pathnameArray.length - 1];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger className="-ms-4" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">
                <RiScanLine size={22} aria-hidden="true" />
                <span className="sr-only">Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize">{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex gap-3 ml-auto">
        {/* <FeedbackDialog /> */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default memo(Header);
