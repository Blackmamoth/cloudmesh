import React from "react";
import { Icon } from "@iconify/react";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import { useTheme } from "next-themes";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip
      content={`Switch to ${isDark ? "light" : "dark"} mode`}
      placement="bottom"
    >
      <div className="flex items-center gap-2">
        <Switch
          className="mx-1"
          color="primary"
          endContent={<Icon className="text-lg" icon="lucide:moon" />}
          isSelected={isDark}
          size="sm"
          startContent={<Icon className="text-lg" icon="lucide:sun" />}
          onValueChange={handleToggle}
        />
      </div>
    </Tooltip>
  );
};
