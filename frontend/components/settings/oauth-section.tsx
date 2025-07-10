import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";

export const OAuthSection = () => {
  const connectedApps = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "logos:google-drive",
      status: "Connected",
      expiresIn: "29 days",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "logos:dropbox",
      status: "Connected",
      expiresIn: "14 days",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: "logos:microsoft-onedrive",
      status: "Connected",
      expiresIn: "60 days",
    },
    {
      id: "box",
      name: "Box",
      icon: "logos:box",
      status: "Expired",
      expiresIn: "Expired",
    },
  ];

  return (
    <Card className="scroll-mt-16" id="oauth">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">OAuth Tokens</h3>
            <p className="text-foreground-500">
              Manage your connected cloud storage providers
            </p>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="space-y-6">
          {connectedApps.map((app) => (
            <div key={app.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-content2">
                  <Icon className="text-2xl" icon={app.icon} />
                </div>
                <div>
                  <h4 className="font-medium">{app.name}</h4>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={app.status === "Connected" ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {app.status}
                    </Chip>
                    <span className="text-xs text-foreground-500">
                      {app.expiresIn === "Expired"
                        ? "Token expired"
                        : `Expires in ${app.expiresIn}`}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                color={app.status === "Connected" ? "default" : "primary"}
                size="sm"
                startContent={
                  <Icon
                    icon={
                      app.status === "Connected"
                        ? "lucide:refresh-cw"
                        : "lucide:key"
                    }
                  />
                }
                variant="flat"
              >
                {app.status === "Connected" ? "Refresh Token" : "Reconnect"}
              </Button>
            </div>
          ))}

          <div className="mt-6">
            <Button
              color="primary"
              startContent={<Icon icon="lucide:refresh-cw" />}
              variant="flat"
            >
              Refresh All Tokens
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
