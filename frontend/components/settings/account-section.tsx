import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";

export const AccountSection = () => {
  const [name, setName] = React.useState("John Doe");
  const [email, setEmail] = React.useState("john.doe@example.com");
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    // Save logic would go here
    setIsEditing(false);
  };

  return (
    <Card className="scroll-mt-16" id="account">
      <CardBody className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              isBordered
              showFallback
              className="w-16 h-16"
              src="https://img.heroui.chat/image/avatar?w=200&h=200&u=cloudmesh1"
            />
            <div>
              <h3 className="text-xl font-semibold">Account Information</h3>
              <p className="text-foreground-500">
                Manage your personal details
              </p>
            </div>
          </div>

          {!isEditing ? (
            <Button
              color="primary"
              startContent={<Icon icon="lucide:edit" />}
              variant="flat"
              onPress={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="flat" onPress={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <Divider className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <Input
              disabled={!isEditing}
              label="Full Name"
              startContent={
                <Icon className="text-default-400" icon="lucide:user" />
              }
              value={name}
              onValueChange={setName}
            />
          </div>
          <div>
            <Input
              disabled={!isEditing}
              label="Email Address"
              startContent={
                <Icon className="text-default-400" icon="lucide:mail" />
              }
              value={email}
              onValueChange={setEmail}
            />
          </div>

          <div>
            <Input
              disabled={!isEditing}
              label="Company"
              placeholder="Your company (optional)"
              startContent={
                <Icon className="text-default-400" icon="lucide:briefcase" />
              }
            />
          </div>
          <div>
            <Input
              disabled={!isEditing}
              label="Job Title"
              placeholder="Your job title (optional)"
              startContent={
                <Icon className="text-default-400" icon="lucide:tag" />
              }
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-6">
            <Button
              color="primary"
              startContent={<Icon icon="lucide:upload" />}
              variant="flat"
            >
              Change Profile Picture
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
