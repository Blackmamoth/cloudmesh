export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "CloudMesh",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "File Browser",
      href: "/dashboard/files",
    },
    {
      label: "Linked Accounts",
      href: "/dashboard/linked-accounts",
    },
  ],
  links: {
    github: "https://github.com/Blackmamoth/cloudmesh",
    twitter: "https://x.com/AshpakVeetar",
    // docs: "https://heroui.com",
    // discord: "https://discord.gg/9b6yyZKmH4",
    // sponsor: "https://patreon.com/jrgarciadev",
  },
};
