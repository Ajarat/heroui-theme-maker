import type {Meta, StoryObj} from "@storybook/react-vite";

import {Button, Chip} from "@/components";

/** This library's second accent color. HeroUI has no slot for one, so it's set up in src/theme/extensions.css. */
const meta: Meta = {
  title: "Components/Theme/Accent 2",
};

export default meta;

export const Usage: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Accent</Button>
        <Button className="button--accent-2">Accent 2</Button>
        <Chip className="chip--accent-2">Soft chip</Chip>
        <Chip className="chip--accent-2" variant="primary">
          Solid chip
        </Chip>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-accent-2 px-3 py-1.5 text-accent-2-foreground">bg-accent-2</span>
        <span className="rounded-lg bg-accent-2-soft px-3 py-1.5 text-accent-2-soft-foreground">bg-accent-2-soft</span>
        <span className="px-3 py-1.5 font-medium text-accent-2-soft-foreground">text-accent-2-soft-foreground</span>
      </div>
    </div>
  ),
};
