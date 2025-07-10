import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const userTypes = [
  {
    icon: "lucide:briefcase",
    title: "Freelancers",
    description:
      "Manage client files across multiple storage providers without the hassle of switching between services.",
  },
  {
    icon: "lucide:users",
    title: "Teams",
    description:
      "Collaborate efficiently by accessing shared files from different cloud storage accounts in one place.",
  },
  {
    icon: "lucide:zap",
    title: "Power Users",
    description:
      "Streamline your workflow with advanced search and organization features across all your cloud storage.",
  },
];

export const WhoItsForSection = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Who It's For</h2>
        <p className="text-foreground-600 text-lg max-w-2xl mx-auto">
          CloudMesh is designed for anyone who works with files across multiple
          cloud services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userTypes.map((user, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className="feature-card h-full">
              <CardBody className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full mb-4">
                  <Icon className="text-primary text-3xl" icon={user.icon} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{user.title}</h3>
                <p className="text-foreground-600">{user.description}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
