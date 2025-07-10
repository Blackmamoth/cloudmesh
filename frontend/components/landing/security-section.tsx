import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export const SecuritySection = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card overflow-hidden">
          <CardBody className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-full">
                <Icon
                  className="text-primary text-6xl"
                  icon="lucide:shield-check"
                />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Your data stays yours.
                </h2>
                <p className="text-xl text-foreground-600 max-w-2xl">
                  No files are stored on CloudMesh servers. We simply provide a
                  secure interface to access your existing cloud storage.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </section>
  );
};
