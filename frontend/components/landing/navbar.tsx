import React from "react";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Link } from "@heroui/link";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { authClient } from "@/lib/auth-client";

export const Navbar = () => {
  const { data } = authClient.useSession();

  return (
    <HeroNavbar className="bg-transparent" maxWidth="xl">
      <NavbarBrand>
        <div className="flex items-center gap-2">
          <Icon className="text-primary text-2xl" icon="lucide:layers" />
          <p className="font-bold text-inherit text-lg">CloudMesh</p>
        </div>
      </NavbarBrand>
      <NavbarContent justify="end">
        <Button
          as={Link}
          color="default"
          href="https://github.com/blackmamoth/cloudmesh"
          startContent={<Icon icon="lucide:github" />}
          target="_blank"
          variant="flat"
        >
          Star on GitHub
        </Button>
        {!data?.user.id && (
          <Button
            as={Link}
            color="primary"
            href="/auth"
            startContent={<Icon icon="lucide:log-in" />}
          >
            Sign in
          </Button>
        )}
        <NavbarItem className="ml-7">
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
