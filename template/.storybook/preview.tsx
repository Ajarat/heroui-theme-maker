import type {Decorator, Preview} from "@storybook/react-vite";

import {DocsContainer, type DocsContainerProps} from "@storybook/addon-docs/blocks";
import {type PropsWithChildren, useEffect, useState} from "react";
import {GLOBALS_UPDATED} from "storybook/internal/core-events";
import {themes} from "storybook/theming";

import "./preview.css";

/** Docs pages have their own Storybook theme, which has to follow the Mode toolbar too. */
function ThemedDocsContainer({children, context}: PropsWithChildren<DocsContainerProps>) {
  const [mode, setMode] = useState<unknown>(() => context.store.userGlobals.get().theme);

  useEffect(() => {
    const onChange = ({globals}: {globals: {theme?: unknown}}) => setMode(globals.theme);
    context.channel.on(GLOBALS_UPDATED, onChange);

    return () => context.channel.off(GLOBALS_UPDATED, onChange);
  }, [context]);

  return (
    <DocsContainer context={context} theme={mode === "dark" ? themes.dark : themes.light}>
      {children}
    </DocsContainer>
  );
}

const withThemeMode: Decorator = (Story, context) => {
  const mode = context.globals.theme === "dark" ? "dark" : "light";
  const root = document.documentElement;

  root.setAttribute("data-theme", mode);
  root.classList.remove("light", "dark");
  root.classList.add(mode);

  return <Story />;
};

const preview: Preview = {
  decorators: [withThemeMode],
  globalTypes: {
    theme: {
      description: "Light or dark mode",
      toolbar: {
        dynamicTitle: true,
        icon: "contrast",
        items: [
          {icon: "sun", title: "Light", value: "light"},
          {icon: "moon", title: "Dark", value: "dark"},
        ],
        title: "Mode",
      },
    },
  },
  initialGlobals: {theme: "light"},
  parameters: {
    controls: {matchers: {color: /(background|color)$/i, date: /Date$/}},
    docs: {container: ThemedDocsContainer},
    layout: "centered",
    options: {storySort: {order: ["Theme Studio", "Components"]}},
  },
  tags: ["autodocs"],
};

export default preview;
