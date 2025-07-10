import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

export const NaturalLanguageSearch = () => {
  const [searchValue, setSearchValue] = React.useState("");

  const exampleQueries = [
    "Show PDFs synced from Dropbox this week",
    "Find images larger than 5MB",
    "Show files shared with me yesterday",
    "Find duplicates across all providers",
  ];

  const handleExampleClick = (query: string) => {
    setSearchValue(query);
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="glass-card bg-gradient-to-r from-primary-900/5 to-primary-500/5 dark:from-primary-900/10 dark:to-primary-500/10">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Icon className="text-primary text-xl" icon="lucide:sparkles" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Natural Language Search</h3>
              <p className="text-sm text-foreground-500">
                Coming soon! Search your files using natural language
              </p>
            </div>
          </div>

          <div className="relative mb-4">
            <Input
              disabled
              className="pr-24"
              endContent={
                <Button isDisabled color="primary" size="sm" variant="flat">
                  Search
                </Button>
              }
              placeholder="Try: 'Show PDFs synced from Dropbox this week'"
              startContent={
                <Icon className="text-default-400" icon="lucide:search" />
              }
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <div className="absolute -top-2 -right-2">
              <Chip color="primary" size="sm" variant="solid">
                Coming Soon
              </Chip>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((query, index) => (
              <Chip
                key={index}
                className="cursor-pointer"
                color="default"
                variant="flat"
                onClick={() => handleExampleClick(query)}
              >
                {query}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
