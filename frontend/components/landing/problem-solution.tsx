import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Image } from "@heroui/image";

const problems = [
  {
    icon: "lucide:search",
    problem: "Can't remember where your files are?",
    solution: "Search across all your cloud storage in one place.",
  },
  {
    icon: "lucide:copy",
    problem: "Tired of switching between tabs?",
    solution: "Access all your files in a single, unified interface.",
  },
  {
    icon: "lucide:shuffle",
    problem: "Managing multiple accounts is a mess?",
    solution: "Connect all your accounts and organize them logically.",
  },
];

export const ProblemSolutionSection = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          From Frustration to Solution
        </h2>
        <p className="text-foreground-600 text-lg max-w-2xl mx-auto">
          CloudMesh solves the everyday challenges of working with multiple
          cloud storage providers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          {problems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card">
                <CardBody className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                      <Icon
                        className="text-primary text-2xl"
                        icon={item.icon}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {item.problem}
                      </h3>
                      <p className="text-foreground-600">{item.solution}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900/20 rounded-xl blur-3xl opacity-20" />
          <div className="relative rounded-xl overflow-hidden border border-divider shadow-lg">
            <Image
              alt="CloudMesh Interface"
              className="w-full h-auto object-cover"
              src="https://img.heroui.chat/image/dashboard?w=800&h=600&u=cloudmesh2"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
