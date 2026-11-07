# Theme Maker

One Storybook per project. Each library is a separate install of HeroUI v3 with its
own stories and theme, so a change in one never reaches another unless you copy it.

## Run it

```bash
pnpm dev
```

This opens the hub at http://localhost:6100. Start a library there, then open its
**Theme Studio** or **Storybook**. To run one Storybook without the hub:

```bash
pnpm --dir libraries/todoapp9000 dev
```

## Layout

```
hub/          The launcher page
scripts/      Creating libraries and copying between them
template/     A fresh HeroUI install. Copied once per library, then never linked again
libraries/
  todoapp9000/
    .storybook/           Storybook config, plus the Update endpoint (theme-api.ts)
    src/components/       Public entry point. Override a component here
    src/stories/          One file per component, based on HeroUI's official stories
    src/studio/           The Theme Studio
    src/theme/
      theme.json          What the Studio edits: only what differs from stock HeroUI
      theme.css           Generated from theme.json
      fonts.css           Generated from theme.json
      custom.css          Your hand-written tweaks. The Studio never touches this
      extensions.css      Tokens added on top of HeroUI (second accent, per-component radii)
      tokens.ts           The list of editable tokens and the CSS generator
```

Each library has its own `package.json`, lockfile and `node_modules`, and there is no
pnpm workspace or shared package. Each can upgrade HeroUI on its own schedule.

## Theming a library

In the Theme Studio, changes preview live and stay local until you press **Update**,
which rewrites that library's `src/theme` files. Every story then picks them up through
hot reload. Stock values are read from the HeroUI version the library has installed.

- **Contrast is enforced.** Every piece of text in the preview, plus open overlays and
  hovered buttons, is checked in both light and dark against WCAG AA for normal text
  (4.5:1, whatever the size). Update stays disabled until everything passes. Click an issue
  to jump to it. Disabled controls are exempt, as in WCAG. Stock HeroUI itself fails in a
  few places (white on its blue accent is about 3.6:1), so a fresh library's first save
  needs those fixed.
- The "Text on tints" colors (Accent text, Success text, and so on) are the colors HeroUI
  uses for soft chips, alerts, secondary buttons and colored text. HeroUI normally mixes
  them automatically; setting them explicitly is how you keep them at AA.
- A blue dot marks a changed setting, and ↺ returns it to the HeroUI default.
- **Discard changes** returns to the last Update.
- **Start from HeroUI defaults** clears everything in the draft. Nothing is saved until Update.
- Accent and Success are shared by light and dark because that is how HeroUI defines
  them. Other colors are edited per mode, so switch to Dark to adjust those.
- Heading font is an addition: HeroUI has no heading token, so it targets headings,
  Typography headings, card titles and modal headings.
- Accent 2 is an addition too. Use `<Button className="button--accent-2">`,
  `<Chip className="chip--accent-2">` (add `variant="primary"` for solid), or Tailwind
  classes like `bg-accent-2` and `bg-accent-2-soft`. Until you set it, it matches Accent.
- Corners have five controls. Base radius scales everything, and Button, Surface (cards,
  alerts, surface accordions, tables), Nested surface (`Surface` components inside cards
  and table header rows; follows Surface × ⅔) and Input radius override their part.
  Overlays (popovers, modals, tooltips) follow Base radius. HeroUI's `Surface` has no radius
  of its own, so don't add `rounded-*` classes to it, or the slider can't reach it.

## Changing one library's components

Stories and the Studio import from `src/components/index.ts`, which re-exports HeroUI.
To change a component for one library only, export your version from there:

```ts
export * from "@heroui/react";
export {Button} from "./button"; // Wins over the wildcard above
```

For per-component styling, HeroUI's BEM classes (`.button--primary`, `.card__title`) can
be targeted from `custom.css`.

## Sharing on purpose

Nothing crosses between libraries by itself. To copy something:

```bash
pnpm run new my-project
```

```bash
pnpm run copy todoapp9000 my-project
```

```bash
pnpm run copy todoapp9000 my-project src/stories/button.stories.tsx src/components
```

With no paths, `copy` takes the theme files. It overwrites the destination files. The
hub also has a Copy theme form once there are two libraries. Use `template` as the source
to pull an improved Studio into an existing library:

```bash
pnpm run copy template todoapp9000 src/studio
```

Changes to `template/` only affect libraries created afterwards.

## Upgrading HeroUI

In one library, run:

```bash
pnpm --dir libraries/todoapp9000 up --latest @heroui/react @heroui/styles
```

HeroUI's peer dependencies (`react-aria`, `react-aria-components`) may need to move too.
The stories were written for HeroUI 3.2.7 and won't update themselves.

## Notes

- `pnpm typecheck` inside a library skips `src/stories`, because the upstream stories
  contain a few loose types. The stories themselves render fine.
- Story icons come from Iconify, and fonts from Google Fonts, so both need internet access.
- The stories are adapted from [HeroUI](https://github.com/heroui-inc/heroui) v3.2.7
  (Apache-2.0). Their internal imports were rewritten to `@/components`. See
  `src/stories/LICENSE.heroui` in each library.
