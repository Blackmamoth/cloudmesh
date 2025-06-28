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
        <Icon
          className={`text-xl ${!isDark ? "text-primary-500" : "text-default-500"}`}
          icon="lucide:sun"
        />
        <Switch
          className="mx-1"
          color="primary"
          isSelected={isDark}
          size="sm"
          onValueChange={handleToggle}
        />
        <Icon
          className={`text-xl ${isDark ? "text-primary-500" : "text-default-500"}`}
          icon="lucide:moon"
        />
      </div>
    </Tooltip>
  );
};
