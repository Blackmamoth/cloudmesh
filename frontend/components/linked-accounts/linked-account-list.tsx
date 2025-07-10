import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";

import { mockAccounts } from "./mock-data";

export const LinkedAccountsList = () => {
  // Group accounts by provider
  const accountsByProvider = React.useMemo(() => {
    const grouped = mockAccounts.reduce(
      (acc, account) => {
        if (!acc[account.provider]) {
          acc[account.provider] = [];
        }
        acc[account.provider].push(account);

        return acc;
      },
      {} as Record<string, typeof mockAccounts>,
    );

    // Sort providers alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce(
        (acc, provider) => {
          acc[provider] = grouped[provider];

          return acc;
        },
        {} as Record<string, typeof mockAccounts>,
      );
  }, []);

  // Get provider color
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "Google Drive":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30";
      case "Dropbox":
        return "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30";
      case "OneDrive":
        return "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/30";
      case "Box":
        return "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30";
      default:
        return "bg-default-100 dark:bg-default-100/20 border-default-200 dark:border-default-700/30";
    }
  };

  // Get provider logo
  const getProviderLogo = (provider: string) => {
    switch (provider) {
      case "Google Drive":
        return "logos:google-drive";
      case "Dropbox":
        return "logos:dropbox";
      case "OneDrive":
        return "logos:microsoft-onedrive";
      case "Box":
        return "logos:box";
      default:
        return "lucide:cloud";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "success";
      case "syncing":
        return "warning";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  // Format last synced time
  const formatLastSynced = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);

      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);

        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      }
    }
  };

  // Format storage usage
  const formatStorageUsage = (used: number, total: number) => {
    const formatSize = (size: number) => {
      if (size < 1024) {
        return `${size} MB`;
      } else {
        return `${(size / 1024).toFixed(1)} GB`;
      }
    };

    return `${formatSize(used)} of ${formatSize(total)} used`;
  };

  // Calculate usage percentage
  const calculateUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  // Get usage color based on percentage
  const getUsageColor = (percentage: number) => {
    if (percentage > 90) {
      return "danger";
    } else if (percentage > 75) {
      return "warning";
    } else {
      return "success";
    }
  };

  // Handle account action
  const handleAccountAction = (accountId: string, action: string) => {
    console.log(`Performing ${action} on account ${accountId}`);
    // Implementation would go here
  };

  return (
    <div className="space-y-8">
      {Object.entries(accountsByProvider).map(
        ([provider, accounts], providerIndex) => (
          <motion.div
            key={provider}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: providerIndex * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Icon className="text-2xl" icon={getProviderLogo(provider)} />
              <h3 className="text-xl font-semibold">{provider}</h3>
              <Badge color="primary" size="sm" variant="flat">
                {accounts.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account, index) => {
                const usagePercentage = calculateUsagePercentage(
                  account.storageUsed,
                  account.storageTotal,
                );
                const usageColor = getUsageColor(usagePercentage);

                return (
                  <motion.div
                    key={account.id}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    transition={{
                      duration: 0.3,
                      delay: providerIndex * 0.1 + index * 0.05,
                    }}
                  >
                    <Tooltip
                      closeDelay={0}
                      content={
                        <div className="p-2">
                          <p className="font-medium mb-1">Account Details</p>
                          <p className="text-xs text-foreground-500">
                            Linked on:{" "}
                            {new Date(account.linkedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-foreground-500">
                            Token expires:{" "}
                            {new Date(
                              account.tokenExpiration,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-foreground-500">
                            Account ID: {account.id}
                          </p>
                        </div>
                      }
                      delay={500}
                      placement="top"
                    >
                      <Card
                        isPressable
                        className={`border ${getProviderColor(provider)} hover:shadow-md transition-shadow duration-200`}
                      >
                        <CardBody className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                isBordered
                                showFallback
                                color={
                                  account.status === "error"
                                    ? "danger"
                                    : undefined
                                }
                                name={account.name}
                                size="lg"
                                src={account.avatar}
                              />
                              <div>
                                <h4 className="font-semibold">
                                  {account.name}
                                </h4>
                                <p className="text-sm text-foreground-500">
                                  {account.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                className="hidden sm:flex"
                                color={getStatusColor(account.status)}
                                size="sm"
                                variant="flat"
                              >
                                {account.status === "healthy"
                                  ? "Healthy"
                                  : account.status === "syncing"
                                    ? "Syncing"
                                    : "Error"}
                              </Badge>

                              <Dropdown>
                                <DropdownTrigger>
                                  <Button isIconOnly size="sm" variant="light">
                                    <Icon icon="lucide:more-vertical" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Account actions">
                                  <DropdownItem
                                    key="force-sync"
                                    startContent={
                                      <Icon icon="lucide:refresh-cw" />
                                    }
                                    onPress={() =>
                                      handleAccountAction(
                                        account.id,
                                        "force-sync",
                                      )
                                    }
                                  >
                                    Force Sync
                                  </DropdownItem>
                                  <DropdownItem
                                    key="reauthenticate"
                                    startContent={<Icon icon="lucide:key" />}
                                    onPress={() =>
                                      handleAccountAction(
                                        account.id,
                                        "reauthenticate",
                                      )
                                    }
                                  >
                                    Re-authenticate
                                  </DropdownItem>
                                  <DropdownItem
                                    key="toggle-sync"
                                    startContent={
                                      <Icon
                                        icon={
                                          account.syncEnabled
                                            ? "lucide:pause"
                                            : "lucide:play"
                                        }
                                      />
                                    }
                                    onPress={() =>
                                      handleAccountAction(
                                        account.id,
                                        "toggle-sync",
                                      )
                                    }
                                  >
                                    {account.syncEnabled
                                      ? "Disable Sync"
                                      : "Enable Sync"}
                                  </DropdownItem>
                                  <DropdownItem
                                    key="unlink"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Icon icon="lucide:unlink" />}
                                    onPress={() =>
                                      handleAccountAction(account.id, "unlink")
                                    }
                                  >
                                    Unlink Account
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          </div>

                          <Divider className="my-4" />

                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Storage</span>
                                <span className="text-xs text-foreground-500">
                                  {formatStorageUsage(
                                    account.storageUsed,
                                    account.storageTotal,
                                  )}
                                </span>
                              </div>
                              <Progress
                                aria-label="Storage usage"
                                className="h-2"
                                color={usageColor}
                                size="sm"
                                value={usagePercentage}
                              />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-1">
                                <Icon
                                  className="text-foreground-500"
                                  icon="lucide:clock"
                                />
                                <span className="text-foreground-500">
                                  Last synced:
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {account.status === "syncing" ? (
                                  <>
                                    <span className="animate-spin">
                                      <Icon
                                        className="text-warning"
                                        icon="lucide:loader"
                                      />
                                    </span>
                                    <span className="text-warning">
                                      Syncing now...
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    {formatLastSynced(account.lastSynced)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {account.status === "error" && (
                              <div className="flex items-start gap-1 text-sm text-danger">
                                <Icon
                                  className="mt-0.5"
                                  icon="lucide:alert-circle"
                                />
                                <span>{account.errorMessage}</span>
                              </div>
                            )}

                            {!account.syncEnabled && (
                              <div className="flex items-start gap-1 text-sm text-foreground-500">
                                <Icon className="mt-0.5" icon="lucide:pause" />
                                <span>Sync is currently disabled</span>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ),
      )}

      {/* Empty state when no accounts */}
      {Object.keys(accountsByProvider).length === 0 && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-full mb-6">
            <Icon className="text-primary text-5xl" icon="lucide:cloud-off" />
          </div>

          <h3 className="text-2xl font-bold mb-3">
            No cloud accounts linked yet
          </h3>
          <p className="text-foreground-600 mb-8 max-w-md">
            Connect your cloud storage accounts to start managing all your files
            in one place.
          </p>

          <Button
            color="primary"
            size="lg"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => {}}
          >
            Link New Account
          </Button>
        </motion.div>
      )}
    </div>
  );
};
