import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";

interface AddProviderButtonProps {
  variant: "button" | "floating";
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const providers: Provider[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    icon: "logos:google-drive",
    description: "Connect to your Google Drive account",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "logos:dropbox",
    description: "Connect to your Dropbox account",
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    icon: "logos:microsoft-onedrive",
    description: "Connect to your OneDrive account",
  },
  {
    id: "box",
    name: "Box",
    icon: "logos:box",
    description: "Connect to your Box account",
  },
  {
    id: "icloud",
    name: "Apple iCloud",
    icon: "logos:apple",
    description: "Connect to your iCloud Drive",
  },
  {
    id: "mega",
    name: "Mega",
    icon: "logos:mega",
    description: "Connect to your Mega account",
  },
  {
    id: "amazon-s3",
    name: "Amazon S3",
    icon: "logos:aws-s3",
    description: "Connect to Amazon S3 storage",
  },
];

export const AddProviderButton: React.FC<AddProviderButtonProps> = ({
  variant,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] =
    React.useState<Provider | null>(null);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  if (variant === "button") {
    return (
      <>
        <Dropdown>
          <DropdownTrigger>
            <Button color="primary" startContent={<Icon icon="lucide:plus" />}>
              Add Provider
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Cloud providers">
            {providers.map((provider) => (
              <DropdownItem
                key={provider.id}
                description={provider.description}
                startContent={<Icon className="text-xl" icon={provider.icon} />}
                onPress={() => handleProviderSelect(provider)}
              >
                {provider.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {renderModal()}
      </>
    );
  }

  return (
    <>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3,
        }}
      >
        <Dropdown placement="top">
          <DropdownTrigger>
            <Button
              isIconOnly
              className="rounded-full shadow-lg backdrop-blur-lg bg-primary-500/95"
              color="primary"
              size="lg"
            >
              <Icon className="text-2xl" icon="lucide:plus" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Cloud providers"
            className="backdrop-blur-lg bg-content1/95"
          >
            {providers.map((provider) => (
              <DropdownItem
                key={provider.id}
                description={provider.description}
                startContent={<Icon className="text-xl" icon={provider.icon} />}
                onPress={() => handleProviderSelect(provider)}
              >
                {provider.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </motion.div>

      {renderModal()}
    </>
  );

  function renderModal() {
    const { data } = authClient.useSession();

    const onLink = async () => {
      // await authClient.getSession({
      //   fetchOptions: {
      //     onSuccess: async (ctx) => {
      //       const jwt = ctx.response.headers.get("set-auth-jwt");
      //       console.log(jwt);
      //       const response = await fetch(
      //         "http://localhost:8080/v1/api/link/google",
      //         {
      //           method: "GET",
      //           headers: {
      //             Authorization: `Bearer ${jwt}`,
      //           },
      //         }
      //       );
      //       const body = await response.json();
      //       window.location.href = body.data.consent_page_url;
      //     },
      //   },
      // });
      // });
      const id = data?.user.id;
      const obj = btoa(
        JSON.stringify({ user_id: id, nonce: crypto.randomUUID() })
      );
      const url = `http://localhost:8080/v1/api/link/google?state=${encodeURIComponent(obj)}`;
      console.log(url);
      document.location.href = url;
    };

    if (!selectedProvider) return null;

    return (
      <Modal
        backdrop="blur"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Connect to {selectedProvider.name}
              </ModalHeader>
              <ModalBody>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-md bg-content2">
                    <Icon className="text-3xl" icon={selectedProvider.icon} />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedProvider.name}</h3>
                    <p className="text-sm text-foreground-500">
                      {selectedProvider.description}
                    </p>
                  </div>
                </div>

                <p className="text-foreground-600 mb-4">
                  {`You'll be redirected to ${selectedProvider.name} to authorize
                  CloudMesh to access your files. CloudMesh will only have
                  access to the files you choose.`}
                </p>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <Icon
                      className="text-primary-500 mt-0.5"
                      icon="lucide:shield"
                    />
                    <p className="text-sm text-foreground-600">
                      CloudMesh uses secure OAuth to connect to your accounts.
                      Your credentials are never stored on our servers.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  startContent={<Icon icon={selectedProvider.icon} />}
                  onPress={onLink}
                >
                  Connect to {selectedProvider.name}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
};
