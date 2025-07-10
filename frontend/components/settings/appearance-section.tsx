import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/button";
import { ButtonGroup } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Radio, RadioGroup } from "@heroui/radio";
import { Switch } from "@heroui/switch";

export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <Card className="scroll-mt-16 overflow-visible" id="appearance">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Appearance</h3>
            <p className="text-foreground-500">Customize how CloudMesh looks</p>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="space-y-8">
          {/* Theme Selector */}
          <div>
            <h4 className="text-lg font-medium mb-4">Theme</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <Card
                isPressable
                className={`w-full sm:w-40 h-40 border-2 ${!isDark ? "border-primary" : "border-transparent"}`}
                onPress={() => handleThemeChange("light")}
              >
                <CardBody className="p-0 overflow-hidden">
                  <div className="h-full bg-white flex flex-col">
                    <div className="h-10 bg-blue-500 flex items-center px-3">
                      <div className="w-3 h-3 rounded-full bg-white mr-1" />
                      <div className="w-3 h-3 rounded-full bg-white mr-1" />
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                    <div className="flex flex-1 p-2">
                      <div className="w-1/3 bg-gray-100 h-full" />
                      <div className="w-2/3 p-2">
                        <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                        <div className="h-3 bg-gray-200 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card
                isPressable
                className={`w-full sm:w-40 h-40 border-2 ${isDark ? "border-primary" : "border-transparent"}`}
                onPress={() => handleThemeChange("dark")}
              >
                <CardBody className="p-0 overflow-hidden">
                  <div className="h-full bg-gray-900 flex flex-col">
                    <div className="h-10 bg-gray-800 flex items-center px-3">
                      <div className="w-3 h-3 rounded-full bg-gray-600 mr-1" />
                      <div className="w-3 h-3 rounded-full bg-gray-600 mr-1" />
                      <div className="w-3 h-3 rounded-full bg-gray-600" />
                    </div>
                    <div className="flex flex-1 p-2">
                      <div className="w-1/3 bg-gray-800 h-full" />
                      <div className="w-2/3 p-2">
                        <div className="h-3 bg-gray-700 rounded mb-2 w-full" />
                        <div className="h-3 bg-gray-700 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="mt-4">
              <ButtonGroup>
                <Button
                  color={!isDark ? "primary" : "default"}
                  startContent={<Icon icon="lucide:sun" />}
                  variant={!isDark ? "solid" : "flat"}
                  onPress={() => handleThemeChange("light")}
                >
                  Light
                </Button>
                <Button
                  color={isDark ? "primary" : "default"}
                  startContent={<Icon icon="lucide:moon" />}
                  variant={isDark ? "solid" : "flat"}
                  onPress={() => handleThemeChange("dark")}
                >
                  Dark
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Density Settings */}
          <div>
            <h4 className="text-lg font-medium mb-4">Interface Density</h4>
            <RadioGroup defaultValue="comfortable" orientation="horizontal">
              <Radio value="compact">Compact</Radio>
              <Radio value="comfortable">Comfortable</Radio>
              <Radio value="spacious">Spacious</Radio>
            </RadioGroup>
          </div>

          {/* Animation Settings */}
          <div>
            <h4 className="text-lg font-medium mb-4">Animations</h4>
            <div className="flex items-center justify-between">
              <div>
                <p>Enable animations</p>
                <p className="text-sm text-foreground-500">
                  Control motion and animations throughout the interface
                </p>
              </div>
              <Switch defaultSelected color="primary" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
