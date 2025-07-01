"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ThemeSwitcher } from "@/components/landing/theme-switcher";
import { authClient } from "@/lib/auth-client";
import { addToast } from "@heroui/toast";

type providerName = "google" | "github";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);

  const oauthProviders = [
    {
      id: "google",
      name: "Google",
      icon: "logos:google-icon",
      color:
        "bg-white text-gray-800 border border-gray-200 dark:border-gray-700",
      hoverColor: "hover:bg-gray-50 dark:hover:bg-gray-900",
    },
    {
      id: "github",
      name: "GitHub",
      icon: "logos:github-icon", // Using the standard GitHub icon mark
      color: "bg-[#24292e] text-white",
      hoverColor: "hover:bg-[#1b1f23]",
    },
  ];

  const onOauthLogin = async (provider: providerName) => {
    await authClient.signIn.social(
      { provider: provider },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => setLoading(false),
        onError: (ctx) => {
          addToast({
            title: `An error occured while signing you in`,
            description: ctx.error.message,
            color: "danger",
          });
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Grid background pattern */}
      <div className="absolute inset-0 dot-pattern" />

      {/* Theme switcher positioned in the corner */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="bg-primary-500 p-1.5 rounded-md">
          <Icon icon="lucide:layers" className="text-white text-xl" />
        </div>
        <p className="font-bold text-xl">CloudMesh</p>
      </div>

      {/* Auth card */}
      <motion.div
        className="w-full max-w-md mx-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="bg-content1/80 backdrop-blur-md rounded-xl border border-divider shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Sign in to CloudMesh</h1>
              <p className="text-foreground-600">
                Access all your cloud storage in one place
              </p>
            </div>

            <div className="space-y-4">
              {oauthProviders.map((provider) => (
                <Button
                  key={provider.id}
                  className={`w-full py-6 ${provider.color} ${provider.hoverColor} transition-colors`}
                  startContent={
                    <div className="flex items-center justify-center w-6 h-6 mr-2">
                      <Icon icon={provider.icon} className="text-xl" />
                    </div>
                  }
                  onClick={() => onOauthLogin(provider.id as providerName)}
                >
                  <span className="font-medium">
                    Continue with {provider.name}
                  </span>
                </Button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-foreground-500">
                By continuing, you agree to CloudMesh's{" "}
                <a href="#" className="text-primary-500 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary-500 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -z-10 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl"
          style={{ top: "-20%", right: "-20%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.div
          className="absolute -z-10 w-64 h-64 rounded-full bg-secondary-500/20 blur-3xl"
          style={{ bottom: "-20%", left: "-20%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
}
