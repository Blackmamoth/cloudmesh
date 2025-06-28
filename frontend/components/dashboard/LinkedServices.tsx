import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

interface ServiceItem {
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  lastSync: string;
}

const services: ServiceItem[] = [
  {
    name: "Google Drive",
    icon: "logos:google-drive",
    status: "connected",
    lastSync: "5 min ago",
  },
  {
    name: "Dropbox",
    icon: "logos:dropbox",
    status: "connected",
    lastSync: "1 hour ago",
  },
  {
    name: "OneDrive",
    icon: "logos:microsoft-onedrive",
    status: "connected",
    lastSync: "3 hours ago",
  },
  {
    name: "Box",
    icon: "logos:box",
    status: "disconnected",
    lastSync: "Never",
  },
];

export const LinkedServices = () => {
  return (
    <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
      <CardBody className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Linked Services</h2>
          <Tooltip content="Add new service">
            <Button
              isIconOnly
              aria-label="Add new service"
              color="primary"
              size="sm"
              variant="flat"
            >
              <Icon icon="lucide:plus" />
            </Button>
          </Tooltip>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 rounded-md bg-content2/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-content1">
                  <Icon className="text-xl" icon={service.icon} />
                </div>
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        service.status === "connected"
                          ? "bg-success-500"
                          : "bg-danger-500"
                      }`}
                    />
                    <span className="text-xs text-foreground-500">
                      {service.status === "connected"
                        ? `Connected • Last sync ${service.lastSync}`
                        : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>

              <Tooltip
                content={
                  service.status === "connected" ? "Sync now" : "Connect"
                }
              >
                <Button
                  isIconOnly
                  aria-label={
                    service.status === "connected" ? "Sync now" : "Connect"
                  }
                  size="sm"
                  variant="light"
                >
                  <Icon
                    className="text-foreground-600"
                    icon={
                      service.status === "connected"
                        ? "lucide:refresh-cw"
                        : "lucide:link"
                    }
                  />
                </Button>
              </Tooltip>
            </div>
          ))}
        </div>

        <Button
          className="w-full mt-4"
          color="primary"
          startContent={<Icon icon="lucide:plus" />}
          variant="flat"
        >
          Link New Account
        </Button>
      </CardBody>
    </Card>
  );
};
