import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";

const features = [
  {
    icon: "lucide:folder-open",
    title: "Unified File Browser",
    description:
      "Browse all your cloud storage files in one seamless interface with powerful search and filtering.",
  },
  {
    icon: "lucide:download",
    title: "Sync & Download",
    description:
      "Download files from any connected cloud service directly to your device with a single click.",
  },
  {
    icon: "lucide:shield",
    title: "No File Storage",
    description:
      "CloudMesh never stores your files. We're just a window to your existing cloud storage.",
  },
  {
    icon: "lucide:users",
    title: "Multiple Account Support",
    description:
      "Connect multiple Google Drive and Dropbox accounts and manage them all in one place.",
  },
  {
    icon: "lucide:zap",
    title: "Fast & Minimal UI",
    description:
      "Lightning-fast interface that focuses on what matters—your files and folders.",
  },
  {
    icon: "lucide:github",
    title: "Open Source",
    description:
      "Fully open source and transparent. Contribute to our GitHub repository and help shape the future.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Powerful Features
        </h2>
        <p className="text-foreground-600 text-lg max-w-2xl mx-auto">
          Everything you need to manage your cloud files efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className="feature-card h-full">
              <CardBody className="p-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                    <Icon
                      className="text-primary text-2xl"
                      icon={feature.icon}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                      {feature.title === "Open Source" && (
                        <Link
                          className="ml-2 text-primary"
                          href="https://github.com/blackmamoth/cloudmesh"
                        >
                          <Icon
                            className="text-sm inline"
                            icon="lucide:external-link"
                          />
                        </Link>
                      )}
                    </h3>
                    <p className="text-foreground-600">{feature.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
