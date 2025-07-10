import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";

export const SecuritySection = () => {
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);

  return (
    <Card className="scroll-mt-16" id="security">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Security</h3>
            <p className="text-foreground-500">Manage your account security</p>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="space-y-6">
          {/* Password Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium">Password</h4>
                <p className="text-sm text-foreground-500">
                  Update your password regularly to keep your account secure
                </p>
              </div>
              <Button
                color="primary"
                startContent={<Icon icon="lucide:key" />}
                variant="flat"
                onPress={() => setShowPasswordForm(!showPasswordForm)}
              >
                Change Password
              </Button>
            </div>

            {showPasswordForm && (
              <div className="mt-4 space-y-4 p-4 bg-content2 rounded-lg">
                <Input
                  label="Current Password"
                  placeholder="Enter your current password"
                  startContent={
                    <Icon className="text-default-400" icon="lucide:lock" />
                  }
                  type="password"
                />
                <Input
                  label="New Password"
                  placeholder="Enter your new password"
                  startContent={
                    <Icon className="text-default-400" icon="lucide:lock" />
                  }
                  type="password"
                />
                <Input
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  startContent={
                    <Icon className="text-default-400" icon="lucide:lock" />
                  }
                  type="password"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="flat"
                    onPress={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button color="primary">Update Password</Button>
                </div>
              </div>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-foreground-500">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch color="primary" />
            </div>
          </div>

          {/* Session Management */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium">Active Sessions</h4>
                <p className="text-sm text-foreground-500">
                  Manage devices where you're currently logged in
                </p>
              </div>
              <Button
                color="danger"
                startContent={<Icon icon="lucide:log-out" />}
                variant="flat"
              >
                Log Out All Devices
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
