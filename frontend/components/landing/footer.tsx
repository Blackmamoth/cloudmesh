import React from "react";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";

export const Footer = () => {
  return (
    <footer className="bg-content1 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary-500 p-1.5 rounded-md">
                <Icon className="text-white text-xl" icon="lucide:layers" />
              </div>
              <p className="font-bold text-xl">CloudMesh</p>
            </div>
            <p className="text-foreground-600 mb-4 max-w-md">
              CloudMesh unifies your cloud storage experience, bringing all your
              accounts together in one seamless interface.
            </p>
            <div className="flex gap-4">
              <Link
                className="text-foreground-500 hover:text-primary-500"
                href="#"
              >
                <Icon className="text-xl" icon="lucide:twitter" />
              </Link>
              <Link
                className="text-foreground-500 hover:text-primary-500"
                href="#"
              >
                <Icon className="text-xl" icon="lucide:github" />
              </Link>
              <Link
                className="text-foreground-500 hover:text-primary-500"
                href="#"
              >
                <Icon className="text-xl" icon="lucide:linkedin" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  className="text-foreground-600"
                  color="foreground"
                  href="#"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Divider className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-foreground-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} CloudMesh. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              className="text-sm text-foreground-500"
              color="foreground"
              href="#"
            >
              Privacy Policy
            </Link>
            <Link
              className="text-sm text-foreground-500"
              color="foreground"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-sm text-foreground-500"
              color="foreground"
              href="#"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
