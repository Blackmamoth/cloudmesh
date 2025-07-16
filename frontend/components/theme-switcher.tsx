"use client";
import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { useTheme } from "next-themes";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip content={`Switch to ${isDark ? "light" : "dark"} mode`}>
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        className="absolute right-4 top-4"
        onPress={handleToggle}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <Icon
          icon={isDark ? "lucide:sun" : "lucide:moon"}
          width={20}
          height={20}
        />
      </Button>
    </Tooltip>
  );
};
