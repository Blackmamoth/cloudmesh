import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { authClient } from "@/lib/auth-client";
import { generateOAuthState, getJWTToken } from "@/lib/utils";
import { APIConfig } from "@/lib/env/client";
import { useSearchParams } from "next/navigation";
import { addToast } from "@heroui/toast";

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data } = authClient.useSession();

  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const success = searchParams.get("successQuery");

    if (success && !hasShownToast.current) {
      hasShownToast.current = true;

      const description =
        success === "newAccount"
          ? "Your account is now connected to CloudMesh!"
          : "That account was already connected. We’ve updated it for you.";

      const url = new URL(window.location.href);
      url.searchParams.delete("successQuery");
      window.history.replaceState({}, "", url.toString());

      addToast({
        title: "Account linked successfully",
        description,
        color: "success",
      });
    }
  }, [searchParams]);

  const providers = [
    {
      id: "google",
      name: "Google Drive",
      icon: "logos:google-drive",
      description: "Connect your Google Drive account",
      color:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700/50",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "logos:dropbox",
      description: "Connect your Dropbox account",
      color:
        "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30 hover:border-indigo-300 dark:hover:border-indigo-700/50",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: "logos:microsoft-onedrive",
      description: "Connect your Microsoft OneDrive account",
      color:
        "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/30 hover:border-cyan-300 dark:hover:border-cyan-700/50",
    },
    {
      id: "box",
      name: "Box",
      icon: "logos:box",
      description: "Connect your Box account",
      color:
        "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600/50",
    },
  ];

  const handleProviderSelect = (providerId: string) => {
    const state = generateOAuthState(data?.user.id!);
    document.location.href = `${APIConfig.API_URL}/api/v1/link/${providerId}?state=${encodeURIComponent(state)}`;
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Link a Cloud Storage Account
            </ModalHeader>
            <ModalBody>
              <p className="text-foreground-600 mb-4">
                Select a cloud storage provider to connect. You'll be redirected
                to sign in and authorize CloudMesh.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {providers.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      isPressable
                      className={`border ${provider.color} transition-all duration-200 w-full h-32 min-h-[8rem] flex items-center justify-center`}
                      onPress={() => handleProviderSelect(provider.id)}
                    >
                      <CardBody className="p-4 flex items-center h-full">
                        <div className="flex items-center gap-4 w-full">
                          <div className="p-2 rounded-md bg-white dark:bg-background">
                            <Icon className="text-3xl" icon={provider.icon} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{provider.name}</h4>
                            <p className="text-sm text-foreground-500">
                              {provider.description}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 text-sm text-foreground-500 flex items-center gap-2">
                <Icon icon="lucide:shield" />
                <p>
                  CloudMesh never stores your files. We only access your files
                  when you use the app.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
