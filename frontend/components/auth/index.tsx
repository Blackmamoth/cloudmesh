"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { ThemeSwitcher } from "@/components/theme-switcher";

export const AuthPage = () => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-100/20 to-background dark:from-primary-900/10 dark:to-background" />
        <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-primary-100/30 to-transparent dark:from-primary-900/20 dark:to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[20vh] bg-gradient-to-t from-background to-transparent" />

        {/* Abstract background shapes */}
        <div className="absolute top-[10%] left-[15%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-primary-200/20 dark:bg-primary-800/10 blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] max-w-[350px] max-h-[350px] rounded-full bg-primary-200/20 dark:bg-primary-800/10 blur-3xl" />
      </div>

      {/* Theme switcher */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>

      {/* Logo */}
      <div className="flex items-center justify-center mt-8 mb-4 z-10">
        <Link className="flex items-center gap-2" href="/">
          <Icon className="text-primary text-3xl" icon="lucide:layers" />
          <span className="font-bold text-xl">CloudMesh</span>
        </Link>
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center px-4 z-10">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card">
            <CardBody className="p-8 flex flex-col gap-6">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Sign in to CloudMesh
                </h1>
                <p className="text-foreground-600">
                  Start managing your cloud files in one dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <Button
                  className="w-full"
                  color="primary"
                  size="lg"
                  startContent={<Icon icon="logos:google-icon" />}
                >
                  Sign in with Google
                </Button>
                <Button
                  className="w-full"
                  color="default"
                  size="lg"
                  startContent={<Icon icon="lucide:github" />}
                  variant="flat"
                >
                  Sign in with GitHub
                </Button>
              </div>

              <div className="flex items-center justify-center text-center mt-2 text-sm text-foreground-500">
                <div className="flex items-center gap-2">
                  <Icon className="text-foreground-500" icon="lucide:lock" />
                  <p>
                    We only request basic login info. Your cloud storage
                    accounts are linked after login—and your files are never
                    stored.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-center mt-6">
            <Button
              as={Link}
              color="default"
              href="https://github.com/cloudmesh"
              size="sm"
              startContent={
                <Icon className="text-foreground-500" icon="lucide:star" />
              }
              target="_blank"
              variant="light"
            >
              Star on GitHub
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
