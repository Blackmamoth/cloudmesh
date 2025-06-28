import React from "react";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { SignInButton } from "@clerk/nextjs";

import { ThemeSwitcher } from "./theme-switcher";

export const Navbar = () => {
  return (
    <HeroNavbar
      isBordered
      className="bg-background/70 backdrop-blur-md border-b border-divider"
      maxWidth="xl"
    >
      <NavbarBrand>
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-primary-500 p-1.5 rounded-md">
            <Icon className="text-white text-xl" icon="lucide:layers" />
          </div>
          <p className="font-bold text-xl">CloudMesh</p>
        </motion.div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarItem>
          <Link className="font-medium" color="foreground" href="#features">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className="font-medium" color="foreground" href="#testimonials">
            Testimonials
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className="font-medium" color="foreground" href="#">
            Pricing
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          <SignInButton>
            <Button
              as={Link}
              className="font-medium"
              color="primary"
              href="#"
              variant="flat"
            >
              Sign In
            </Button>
          </SignInButton>
        </NavbarItem>
        <NavbarItem>
          <Button
            as={Link}
            className="font-medium"
            color="primary"
            href="#"
            variant="solid"
          >
            Get Started
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
