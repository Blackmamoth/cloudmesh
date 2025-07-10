import React from "react";
import { Divider } from "@heroui/divider";
import { Icon } from "@iconify/react";
import { Link } from "@heroui/link";

export const Footer = () => {
  return (
    <footer className="py-12 px-4 max-w-7xl mx-auto">
      <Divider className="mb-8" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Icon className="text-primary text-xl" icon="lucide:layers" />
          <p className="font-semibold text-inherit">CloudMesh</p>
        </div>
        <div className="flex gap-6">
          <Link
            className="text-foreground-600 hover:text-foreground"
            href="https://github.com/blackmamoth"
            target="_blank"
          >
            <Icon className="text-xl" icon="lucide:github" />
            <span className="ml-2">GitHub</span>
          </Link>
          <Link
            className="text-foreground-600 hover:text-foreground"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="text-foreground-600 hover:text-foreground"
            href="https://x.com/AshpakVeetar"
            target="_blank"
          >
            <Icon className="text-xl" icon="lucide:twitter" />
            <span className="ml-2">Twitter</span>
          </Link>
        </div>
        <div className="text-foreground-500 text-sm">
          © {new Date().getFullYear()} CloudMesh. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
