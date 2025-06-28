import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  provider: {
    name: string;
    icon: string;
  } | null;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  provider,
}) => {
  if (!provider) return null;

  return (
    <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Disconnect {provider.name}
            </ModalHeader>
            <ModalBody>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-md bg-content2">
                  <Icon className="text-2xl" icon={provider.icon} />
                </div>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                </div>
              </div>

              <p className="text-foreground-600">
                {`Are you sure you want to disconnect this account? You'll need to
                reconnect it later if you want to access files from this
                provider.`}
              </p>

              <div className="bg-danger-500/10 border border-danger-500/20 rounded-md p-3 mt-3">
                <div className="flex items-start gap-2">
                  <Icon
                    className="text-danger-500 mt-0.5"
                    icon="lucide:alert-triangle"
                  />
                  <p className="text-sm text-danger-500">
                    This will only disconnect the account from CloudMesh. Your
                    files will remain intact in {provider.name}.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={onConfirm}>
                Disconnect
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
