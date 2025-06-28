import React from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export const CallToAction = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/5" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="bg-content1/70 backdrop-blur-lg rounded-2xl p-8 md:p-12 shadow-xl border border-divider glass-effect"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              Ready to Simplify Your{" "}
              <span className="gradient-text">Cloud Experience?</span>
            </motion.h2>

            <motion.p
              className="text-lg text-foreground-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              Start managing all your cloud storage accounts from one unified
              interface. Free plan available with no credit card required.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Button
                className="font-medium text-base"
                color="primary"
                endContent={<Icon icon="lucide:arrow-right" />}
                size="lg"
              >
                Launch CloudMesh
              </Button>

              <Button
                className="font-medium text-base"
                color="primary"
                size="lg"
                variant="bordered"
              >
                View Pricing
              </Button>
            </motion.div>

            <motion.div
              className="mt-8 flex items-center justify-center gap-6"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1 }}
            >
              <div className="flex items-center gap-2 text-sm text-foreground-500">
                <Icon className="text-primary-500" icon="lucide:check-circle" />
                <span>Free plan available</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-500">
                <Icon className="text-primary-500" icon="lucide:check-circle" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-500">
                <Icon className="text-primary-500" icon="lucide:check-circle" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
