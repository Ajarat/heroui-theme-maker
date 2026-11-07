import type {Meta, StoryObj} from "@storybook/react-vite";

import {Studio} from "./studio";

const meta: Meta = {
  parameters: {layout: "fullscreen"},
  tags: ["!autodocs"],
  title: "Theme Studio",
};

export default meta;

export const ThemeStudio: StoryObj = {
  name: "Theme Studio",
  render: (_args, {globals}) => <Studio mode={globals.theme === "dark" ? "dark" : "light"} />,
};
