import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const testimonials = [
  {
    content:
      "CloudMesh has completely transformed how I work with files across multiple cloud services. I can finally search across all my accounts at once!",
    author: "Sarah Johnson",
    role: "Freelance Designer",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=1",
  },
  {
    content:
      "As someone who juggles client files across different platforms, CloudMesh has been a game-changer. The unified interface saves me hours every week.",
    author: "Michael Chen",
    role: "Marketing Consultant",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=2",
  },
  {
    content:
      "Our small team uses different cloud services based on client preferences. CloudMesh lets us access everything in one place without changing our workflow.",
    author: "Alex Rodriguez",
    role: "Project Manager",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3",
  },
];

export const Testimonials = () => {
  return (
    <section
      className="relative bg-background py-24 lg:py-32"
      id="testimonials"
    >
      <div className="absolute inset-0 dot-pattern opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-primary-500/10 p-2 rounded-lg">
              <Icon
                className="text-primary-500 text-3xl"
                icon="lucide:message-square-quote"
              />
            </div>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Loved by <span className="gradient-text">Thousands</span> of Users
          </motion.h2>

          <motion.p
            className="text-lg text-foreground-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            See what our users are saying about how CloudMesh has simplified
            their workflow and improved their productivity.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
                <CardBody className="p-6">
                  <div className="mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        className="inline-block text-primary-500 mr-1"
                        icon="lucide:star"
                      />
                    ))}
                  </div>

                  <p className="text-foreground-600 mb-6">
                    {testimonial.content}
                  </p>

                  <div className="flex items-center">
                    <Avatar
                      className="mr-4"
                      size="md"
                      src={testimonial.avatar}
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.author}</h4>
                      <p className="text-sm text-foreground-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-foreground-500 flex items-center justify-center gap-1">
            <Icon className="text-primary-500" icon="lucide:users" />
            <span>Join over 10,000+ users who trust CloudMesh</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
