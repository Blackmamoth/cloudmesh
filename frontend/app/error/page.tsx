"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/landing/theme-switcher";

export const ErrorLinkingPage = () => {
  const router = useRouter();

  const handleTryAgain = () => {
    // This would typically restart the OAuth flow
    router.push("/auth");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Grid background pattern */}
      <div className="absolute inset-0 dot-pattern" />

      {/* Theme switcher positioned in the corner */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="bg-primary-500 p-1.5 rounded-md">
          <Icon icon="lucide:layers" className="text-white text-xl" />
        </div>
        <p className="font-bold text-xl">CloudMesh</p>
      </div>

      {/* Error card */}
      <motion.div
        className="w-full max-w-md mx-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="bg-content1/80 backdrop-blur-md rounded-xl border border-divider shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mb-6"
              >
                <Icon
                  icon="lucide:link-2-off"
                  className="text-danger-500 text-3xl"
                />
              </motion.div>

              <h1 className="text-2xl font-bold mb-2 text-center">
                Connection Failed
              </h1>
              <p className="text-foreground-600 text-center">
                We couldn't link your account. Something went wrong during the
                authentication process.
              </p>
            </div>

            <div className="bg-content2/50 rounded-lg p-4 mb-6 border border-divider/50">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="text-primary-500 mt-0.5" />
                <p className="text-sm text-foreground-600">
                  This could be due to a temporary issue with the service
                  provider or because you canceled the authentication process.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                size="lg"
                className="w-full font-medium"
                startContent={<Icon icon="lucide:refresh-cw" />}
                onPress={handleTryAgain}
              >
                Try Again
              </Button>

              <Button
                as={Link}
                href="/"
                variant="flat"
                color="default"
                className="w-full font-medium"
                startContent={<Icon icon="lucide:home" />}
              >
                Go Back Home
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -z-10 w-64 h-64 rounded-full bg-danger-500/10 blur-3xl"
          style={{ top: "-20%", right: "-20%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.div
          className="absolute -z-10 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl"
          style={{ bottom: "-20%", left: "-20%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
};
