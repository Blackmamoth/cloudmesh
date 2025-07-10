import React from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";
import { Image } from "@heroui/image";

export const HeroSection = () => {
  return (
    <section className="py-20 md:py-32 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            All your cloud files. <br />
            <span className="text-primary">One clean dashboard.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground-600 max-w-xl">
            Search, browse, and manage files across Google Drive and
            Dropbox—without switching tabs or storing anything on CloudMesh.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button
              as={Link}
              color="primary"
              href="/auth"
              size="lg"
              startContent={<Icon icon="lucide:log-in" />}
            >
              Sign in with Google
            </Button>
            <Button
              color="default"
              size="lg"
              startContent={<Icon icon="lucide:github" />}
              variant="flat"
            >
              Star us on GitHub
            </Button>
          </div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900/20 rounded-xl blur-3xl opacity-20" />
          <div className="relative rounded-xl overflow-hidden border border-divider shadow-lg">
            <Image
              alt="CloudMesh Dashboard"
              className="w-full h-auto object-cover"
              src="https://img.heroui.chat/image/dashboard?w=800&h=600&u=cloudmesh1"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
