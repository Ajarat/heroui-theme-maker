/**
 * Everything the Theme Studio can edit, and how an edited theme becomes CSS.
 * Shared by the browser (live preview) and the dev server (the Update button),
 * so what you preview is exactly what gets written.
 *
 * Token names come from HeroUI's own stylesheet:
 * node_modules/@heroui/styles/dist/themes/default/variables.css
 */

export type Mode = "light" | "dark";
/** Which block of the theme a token lives in. HeroUI shares some tokens across modes. */
export type Scope = "common" | Mode;

export type FontChoice = {
  /** Display name, e.g. "Inter". */
  label: string;
  /** Full CSS font-family value. */
  stack: string;
  /** Stylesheet to load the font from. Omitted for fonts already on the system. */
  url?: string;
};
export type FontSlot = "sans" | "heading" | "mono";

/** Stored as src/theme/theme.json. Only holds what differs from stock HeroUI. */
export type ThemeDoc = {
  version: 1;
  fonts: Partial<Record<FontSlot, FontChoice>>;
  baseFontSize?: string;
  common: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
};

export const emptyTheme = (): ThemeDoc => ({version: 1, fonts: {}, common: {}, light: {}, dark: {}});

type BaseToken = {name: `--${string}`; label: string; hint?: string};
export type ColorToken = BaseToken & {scope: "common" | "mode"};
export type LengthToken = BaseToken & {min: number; max: number; step: number; unit: string};
export type ChoiceToken = BaseToken & {options: {label: string; value: string}[]};

export const COLOR_GROUPS: {label: string; tokens: ColorToken[]}[] = [
  {
    label: "Brand",
    tokens: [
      {name: "--accent", label: "Accent", scope: "common", hint: "Shared by light and dark"},
      {name: "--accent-foreground", label: "On accent", scope: "common", hint: "Shared by light and dark"},
      {name: "--accent-2", label: "Accent 2", scope: "common", hint: "Added by this library: button--accent-2, bg-accent-2"},
      {name: "--accent-2-foreground", label: "On accent 2", scope: "common", hint: "Shared by light and dark"},
      {name: "--focus", label: "Focus ring", scope: "mode"},
      {name: "--link", label: "Link", scope: "mode"},
    ],
  },
  {
    label: "Page",
    tokens: [
      {name: "--background", label: "Background", scope: "mode"},
      {name: "--foreground", label: "Text", scope: "mode"},
      {name: "--muted", label: "Muted text", scope: "mode"},
    ],
  },
  {
    label: "Surfaces",
    tokens: [
      {name: "--surface", label: "Surface", scope: "mode"},
      {name: "--surface-foreground", label: "On surface", scope: "mode"},
      {name: "--surface-secondary", label: "Surface 2", scope: "mode"},
      {name: "--surface-tertiary", label: "Surface 3", scope: "mode"},
      {name: "--overlay", label: "Overlay", scope: "mode"},
      {name: "--overlay-foreground", label: "On overlay", scope: "mode"},
      {name: "--backdrop", label: "Backdrop", scope: "mode"},
    ],
  },
  {
    label: "Neutral controls",
    tokens: [
      {name: "--default", label: "Default", scope: "mode"},
      {name: "--default-foreground", label: "On default", scope: "mode"},
      {name: "--segment", label: "Segment", scope: "mode"},
      {name: "--segment-foreground", label: "On segment", scope: "mode"},
    ],
  },
  {
    label: "Form fields",
    tokens: [
      {name: "--field-background", label: "Field", scope: "mode"},
      {name: "--field-foreground", label: "Field text", scope: "mode"},
      {name: "--field-placeholder", label: "Placeholder", scope: "mode"},
      {name: "--field-border", label: "Field border", scope: "common", hint: "Needs a field border width above 0"},
    ],
  },
  {
    label: "Status",
    tokens: [
      {name: "--success", label: "Success", scope: "common", hint: "Shared by light and dark"},
      {name: "--success-foreground", label: "On success", scope: "common", hint: "Shared by light and dark"},
      {name: "--warning", label: "Warning", scope: "mode"},
      {name: "--warning-foreground", label: "On warning", scope: "mode"},
      {name: "--danger", label: "Danger", scope: "mode"},
      {name: "--danger-foreground", label: "On danger", scope: "mode"},
    ],
  },
  {
    label: "Text on tints",
    tokens: [
      {name: "--accent-soft-foreground", label: "Accent text", scope: "mode", hint: "Secondary buttons, soft accent chips, accent-colored text"},
      {name: "--accent-2-soft-foreground", label: "Accent 2 text", scope: "mode", hint: "Soft Accent 2 chips and text"},
      {name: "--success-soft-foreground", label: "Success text", scope: "mode", hint: "Success alerts and soft chips"},
      {name: "--warning-soft-foreground", label: "Warning text", scope: "mode", hint: "Warning alerts and soft chips"},
      {name: "--danger-soft-foreground", label: "Danger text", scope: "mode", hint: "Danger alerts, soft danger buttons, error messages"},
    ],
  },
  {
    label: "Lines",
    tokens: [
      {name: "--border", label: "Border", scope: "mode"},
      {name: "--separator", label: "Separator", scope: "mode"},
    ],
  },
];

export const SHAPE_TOKENS: LengthToken[] = [
  {name: "--radius", label: "Base radius", hint: "Scales every corner, including the ones below until you change them", min: 0, max: 2, step: 0.025, unit: "rem"},
  {name: "--button-radius", label: "Button radius", hint: "Buttons, toggle buttons, button groups. Follows Base × 3", min: 0, max: 3, step: 0.025, unit: "rem"},
  {name: "--surface-radius", label: "Surface radius", hint: "Cards, alerts, surface accordions, tables. Follows Base × 3", min: 0, max: 3, step: 0.025, unit: "rem"},
  {name: "--nested-surface-radius", label: "Nested surface radius", hint: "Surface components inside cards and surfaces, table header rows. Follows Surface × ⅔", min: 0, max: 3, step: 0.025, unit: "rem"},
  {name: "--field-radius", label: "Input radius", hint: "Inputs, selects, text areas, date fields. Follows Base × 1.5", min: 0, max: 3, step: 0.025, unit: "rem"},
  {name: "--border-width", label: "Border width", min: 0, max: 4, step: 0.5, unit: "px"},
  {name: "--field-border-width", label: "Field border width", min: 0, max: 4, step: 0.5, unit: "px"},
];

export const DENSITY_TOKENS: LengthToken[] = [
  {name: "--spacing", label: "Spacing unit", hint: "Base of all padding, gaps and control heights", min: 0.15, max: 0.4, step: 0.005, unit: "rem"},
  {name: "--ring-offset-width", label: "Focus ring offset", min: 0, max: 6, step: 0.5, unit: "px"},
  {name: "--disabled-opacity", label: "Disabled opacity", min: 0.1, max: 1, step: 0.05, unit: ""},
];

export const SHADOW_TOKENS: BaseToken[] = [
  {name: "--surface-shadow", label: "Surface shadow"},
  {name: "--overlay-shadow", label: "Overlay shadow"},
  {name: "--field-shadow", label: "Field shadow"},
];

export const SHADOW_PRESETS: {label: string; value: string}[] = [
  {label: "None", value: "0 0 0 0 transparent"},
  {label: "Subtle", value: "0 1px 2px 0 rgba(0, 0, 0, 0.06)"},
  {label: "Soft", value: "0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"},
  {label: "Lifted", value: "0 8px 24px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.08)"},
  {label: "Heavy", value: "0 16px 40px 0 rgba(0, 0, 0, 0.2), 0 4px 10px 0 rgba(0, 0, 0, 0.1)"},
];

export const MOTION_TOKENS: ChoiceToken[] = [
  {
    name: "--skeleton-animation",
    label: "Skeleton animation",
    options: [
      {label: "Shimmer", value: "shimmer"},
      {label: "Pulse", value: "pulse"},
      {label: "None", value: "none"},
    ],
  },
];

const gf = (family: string, axis = "") =>
  `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}${axis}&display=swap`;
const sans = (family: string, fallback = "ui-sans-serif, system-ui, sans-serif") => `"${family}", ${fallback}`;
const serif = (family: string) => `"${family}", ui-serif, Georgia, serif`;
const mono = (family: string) => `"${family}", ui-monospace, SFMono-Regular, Menlo, monospace`;

/** The same Google Fonts HeroUI's own theme builder offers. */
export const FONT_CATALOG: Record<FontSlot, FontChoice[]> = (() => {
  const text: FontChoice[] = [
    {label: "Inter", stack: sans("Inter"), url: gf("Inter", ":wght@100..900")},
    {label: "Figtree", stack: sans("Figtree"), url: gf("Figtree", ":wght@300..900")},
    {label: "Hanken Grotesk", stack: sans("Hanken Grotesk"), url: gf("Hanken Grotesk", ":wght@100..900")},
    {label: "Geist", stack: sans("Geist"), url: gf("Geist", ":wght@100..900")},
    {label: "DM Sans", stack: sans("DM Sans"), url: gf("DM Sans", ":wght@100..900")},
    {label: "Public Sans", stack: sans("Public Sans"), url: gf("Public Sans", ":wght@100..900")},
    {label: "Instrument Sans", stack: sans("Instrument Sans"), url: gf("Instrument Sans", ":wght@400..700")},
    {label: "Bricolage Grotesque", stack: sans("Bricolage Grotesque"), url: gf("Bricolage Grotesque", ":wght@200..800")},
    {label: "Fredoka", stack: sans("Fredoka"), url: gf("Fredoka", ":wght@300..700")},
    {label: "Varela Round", stack: sans("Varela Round"), url: gf("Varela Round")},
    {label: "Fraunces", stack: serif("Fraunces"), url: gf("Fraunces", ":wght@100..900")},
  ];
  const code: FontChoice[] = [
    {label: "JetBrains Mono", stack: mono("JetBrains Mono"), url: gf("JetBrains Mono", ":wght@100..800")},
    {label: "IBM Plex Mono", stack: mono("IBM Plex Mono"), url: gf("IBM Plex Mono", ":wght@400;500;600;700")},
    {label: "Geist Mono", stack: mono("Geist Mono"), url: gf("Geist Mono", ":wght@100..900")},
  ];
  return {sans: text, heading: text, mono: code};
})();

/** Tailwind's stock stacks: what stock HeroUI renders with. */
export const DEFAULT_FONT_STACKS: Record<FontSlot, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  heading: "inherit",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};
export const DEFAULT_BASE_FONT_SIZE = "16px";

/** Elements a heading font applies to. HeroUI has no heading token of its own. */
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, [class*="typography--h"], .card__title, .modal__heading';

const block = (selector: string, vars: Record<string, string>) => {
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return lines.length ? `${selector} {\n${lines.join("\n")}\n}\n` : "";
};

/**
 * The light selector excludes dark on purpose. This file is unlayered, so a plain
 * `:root` block would beat HeroUI's dark values and leak light colors into dark mode.
 */
const LIGHT_SELECTOR = ':root:not(.dark, [data-theme="dark"]),\n.light,\n[data-theme="light"]';
const DARK_SELECTOR = '.dark,\n[data-theme="dark"]';

/** Everything except the font imports (see fontsCss: those must come first). */
export function themeCss(theme: ThemeDoc): string {
  const fontVars: Record<string, string> = {};
  if (theme.fonts.sans) fontVars["--font-sans"] = theme.fonts.sans.stack;
  if (theme.fonts.mono) fontVars["--font-mono"] = theme.fonts.mono.stack;

  return [
    block(":root", {...fontVars, ...theme.common}),
    block(LIGHT_SELECTOR, theme.light),
    block(DARK_SELECTOR, theme.dark),
    block("html", theme.baseFontSize ? {"font-size": theme.baseFontSize} : {}),
    block(HEADING_SELECTOR, theme.fonts.heading ? {"font-family": theme.fonts.heading.stack} : {}),
  ]
    .filter(Boolean)
    .join("\n");
}

export function fontsCss(theme: ThemeDoc): string {
  const urls = new Set(Object.values(theme.fonts).flatMap((font) => (font?.url ? [font.url] : [])));
  return [...urls].map((url) => `@import url("${url}");\n`).join("");
}

export const GENERATED_HEADER =
  "/* Generated by the Theme Studio from theme.json. Do not edit: the next Update overwrites it.\n" +
  "   Hand-written tweaks go in custom.css. */\n";

const EDITABLE = new Set<string>([
  ...COLOR_GROUPS.flatMap((group) => group.tokens.map((token) => token.name)),
  ...[...SHAPE_TOKENS, ...DENSITY_TOKENS, ...SHADOW_TOKENS, ...MOTION_TOKENS].map((token) => token.name),
]);

/** Values end up in a stylesheet, so one stray brace would break the whole file. */
const SAFE_VALUE = /^[^{};<>\n\r]{1,600}$/;
const SAFE_URL = /^https:\/\/[^"'()\s<>]+$/;

/** Returns a clean ThemeDoc, or throws saying what is wrong with it. */
export function parseTheme(input: unknown): ThemeDoc {
  const source = input as Partial<ThemeDoc> | null;
  if (!source || typeof source !== "object") throw new Error("Theme must be an object");

  const theme = emptyTheme();
  for (const scope of ["common", "light", "dark"] as const) {
    for (const [name, value] of Object.entries(source[scope] ?? {})) {
      if (!EDITABLE.has(name)) throw new Error(`Unknown token ${name}`);
      if (typeof value !== "string" || !SAFE_VALUE.test(value)) throw new Error(`Invalid value for ${name}`);
      theme[scope][name] = value;
    }
  }
  for (const slot of ["sans", "heading", "mono"] as const) {
    const font = source.fonts?.[slot];
    if (!font) continue;
    if (typeof font.label !== "string" || !SAFE_VALUE.test(font.stack ?? "")) throw new Error(`Invalid ${slot} font`);
    if (font.url !== undefined && !SAFE_URL.test(font.url)) throw new Error(`Invalid ${slot} font URL`);
    theme.fonts[slot] = {label: font.label, stack: font.stack, ...(font.url ? {url: font.url} : {})};
  }
  if (source.baseFontSize !== undefined) {
    if (!/^\d+(\.\d+)?px$/.test(source.baseFontSize)) throw new Error("Invalid base font size");
    theme.baseFontSize = source.baseFontSize;
  }
  return theme;
}
