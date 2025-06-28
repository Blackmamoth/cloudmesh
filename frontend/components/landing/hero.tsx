import React from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Image from "next/image";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-20 lg:pt-28">
      {/* Dot pattern background */}
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero content */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              <span className="gradient-text">Your Cloud,</span> <br />
              <span>One Mesh</span>
            </h1>

            <p className="text-lg md:text-xl text-foreground-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Access and manage all your cloud storage accounts in one unified
              interface — Google Drive, Dropbox, OneDrive, and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                className="font-medium text-base"
                color="primary"
                endContent={<Icon icon="lucide:arrow-right" />}
                size="lg"
              >
                Get Started Free
              </Button>

              <Button
                className="font-medium text-base"
                color="primary"
                size="lg"
                startContent={<Icon icon="lucide:play" />}
                variant="bordered"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl gradient-border">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-primary-400/5 z-0" />
              <Image
                alt="CloudMesh Dashboard"
                className="w-full h-auto relative z-10"
                height={1200}
                src="https://img.heroui.chat/image/dashboard?w=1200&h=800&u=cloudmesh"
                width={800}
              />

              {/* Floating elements */}
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 right-6 bg-white/90 dark:bg-content1/90 p-3 rounded-lg shadow-lg glass-effect flex items-center gap-2"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Icon
                  className="text-primary-500 text-lg"
                  icon="lucide:check-circle"
                />
                <span className="text-sm font-medium">
                  Files synced across all devices
                </span>
              </motion.div>

              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-6 left-6 bg-white/90 dark:bg-content1/90 p-3 rounded-lg shadow-lg glass-effect flex items-center gap-2"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs">
                    G
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    D
                  </div>
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                    O
                  </div>
                </div>
                <span className="text-sm font-medium">
                  All your clouds connected
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-content1 transform translate-y-1/2 rounded-t-[50%] z-10" />
    </section>
  );
};
