"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { AccountSection } from "./account-section";
import { AppearanceSection } from "./appearance-section";
import { SecuritySection } from "./security-section";
import { OAuthSection } from "./oauth-section";

export const SettingsPage = () => {
  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-semibold mb-1"> Account Settings </h2>
          <p className="text-foreground-500">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar with navigation */}
          <div className="lg:col-span-1">
            <SettingsSidebar />
          </div>

          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            <AccountSection />
            <AppearanceSection />
            <SecuritySection />
            <OAuthSection />
          </div>
        </div>
      </motion.div>
    </>
  );
};

const SettingsSidebar = () => {
  const settingsCategories = [
    { id: "account", name: "Account", icon: "lucide:user" },
    { id: "appearance", name: "Appearance", icon: "lucide:palette" },
    { id: "security", name: "Security", icon: "lucide:shield" },
    { id: "oauth", name: "OAuth & Tokens", icon: "lucide:key" },
    { id: "notifications", name: "Notifications", icon: "lucide:bell" },
    { id: "privacy", name: "Privacy", icon: "lucide:eye" },
  ];

  const [activeCategory, setActiveCategory] = React.useState("account");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    // In a real app, this would scroll to the section or change the view
    const element = document.getElementById(categoryId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Card className="sticky top-6">
      <CardBody className="p-4">
        <nav className="flex flex-col gap-1">
          {settingsCategories.map((category) => (
            <Button
              key={category.id}
              className="justify-start w-full"
              color={activeCategory === category.id ? "primary" : "default"}
              startContent={<Icon className="text-lg" icon={category.icon} />}
              variant={activeCategory === category.id ? "flat" : "light"}
              onPress={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </nav>

        <Divider className="my-4" />

        <Button
          className="w-full justify-start"
          color="danger"
          startContent={<Icon icon="lucide:log-out" />}
          variant="flat"
        >
          Log Out
        </Button>
      </CardBody>
    </Card>
  );
};
