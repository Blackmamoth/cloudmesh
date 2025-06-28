import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "lucide:click",
    title: "One-Click Access",
    description:
      "Access files from any cloud storage with a single click. No more switching between apps or browser tabs.",
  },
  {
    icon: "lucide:link",
    title: "Link Multiple Accounts",
    description:
      "Connect unlimited accounts from Google Drive, Dropbox, OneDrive, Box, and more in one unified interface.",
  },
  {
    icon: "lucide:copy",
    title: "No File Duplication",
    description:
      "Files stay in their original location. CloudMesh simply provides a unified view without wasting storage space.",
  },
  {
    icon: "lucide:search",
    title: "Universal Search",
    description:
      "Find any file across all your cloud storage accounts with our powerful search functionality.",
  },
  {
    icon: "lucide:shield",
    title: "Enhanced Security",
    description:
      "Your credentials never touch our servers. Direct API connections ensure your data remains private and secure.",
  },
  {
    icon: "lucide:share-2",
    title: "Seamless Sharing",
    description:
      "Share files from any cloud service with consistent permissions and access controls.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const Features = () => {
  return (
    <section className="relative bg-content1 py-24 lg:py-32" id="features">
      <div className="absolute inset-0 dot-pattern opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Everything You Need in{" "}
            <span className="gradient-text">One Place</span>
          </motion.h2>
          <motion.p
            className="text-lg text-foreground-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            CloudMesh brings all your cloud storage accounts together with
            powerful features that make file management simple and efficient.
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          variants={container}
          viewport={{ once: true }}
          whileInView="show"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="border border-divider bg-content2/50 backdrop-blur-sm h-full">
                <CardBody className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
                    <Icon
                      className="text-primary-500 text-2xl"
                      icon={feature.icon}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-foreground-600">{feature.description}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
