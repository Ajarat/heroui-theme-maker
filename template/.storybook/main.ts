import type {StorybookConfig} from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  core: {disableTelemetry: true, disableWhatsNewNotifications: true},
  features: {sidebarOnboardingChecklist: false},
  framework: "@storybook/react-vite",
  stories: ["../src/studio/*.stories.tsx", "../src/stories/**/*.stories.@(ts|tsx)"],
};

export default config;
