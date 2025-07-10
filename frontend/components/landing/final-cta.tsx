import React from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";
import { authClient } from "@/lib/auth-client";

export const FinalCTA = () => {
  const { data } = authClient.useSession();

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        className="bg-gradient-to-r from-primary-900/10 to-primary-500/10 dark:from-primary-900/20 dark:to-primary-500/20 rounded-2xl p-8 md:p-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {data?.user.id ? (
          <>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready when you are.
            </h2>
            <p className="text-xl text-foreground-600 max-w-2xl mx-auto mb-8">
              Access your dashboard to sync, search, and manage your cloud files
              instantly.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to simplify your cloud storage?
            </h2>
            <p className="text-xl text-foreground-600 max-w-2xl mx-auto mb-8">
              Start managing all your files in one place with CloudMesh today.
            </p>
          </>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {data?.user.id ? (
            <Button
              as={Link}
              color="primary"
              href="/dashboard"
              size="lg"
              startContent={<Icon icon="lucide:log-in" />}
            >
              Continue to Dashboard
            </Button>
          ) : (
            <Button
              as={Link}
              color="primary"
              href="/auth"
              size="lg"
              startContent={<Icon icon="lucide:log-in" />}
            >
              Sign in with Google
            </Button>
          )}
          <Button
            as={Link}
            color="default"
            href="https://github.com/blackmamoth/cloudmesh"
            size="lg"
            startContent={<Icon icon="lucide:github" />}
            target="_blank"
            variant="flat"
          >
            Star us on GitHub
          </Button>
        </div>
      </motion.div>
    </section>
  );
};
