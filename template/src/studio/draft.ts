import type {Defaults} from "./defaults";

import {DEFAULT_BASE_FONT_SIZE, DEFAULT_FONT_STACKS, type FontSlot, type ThemeDoc, fontsCss, themeCss} from "@/theme/tokens";

const SCOPES = ["common", "light", "dark"] as const;
const SLOTS: FontSlot[] = ["sans", "heading", "mono"];

/**
 * CSS for the live preview: the draft, plus an explicit stock value for anything the
 * draft removed but the saved theme.css still sets. Without that, resetting a token
 * would show no change until Update.
 */
export function draftCss(draft: ThemeDoc, saved: ThemeDoc, defaults: Defaults): string {
  const merged: ThemeDoc = structuredClone(draft);

  for (const scope of SCOPES) {
    for (const name of Object.keys(saved[scope])) {
      if (!(name in draft[scope]) && defaults[scope][name]) merged[scope][name] = defaults[scope][name];
    }
  }
  for (const slot of SLOTS) {
    if (saved.fonts[slot] && !draft.fonts[slot]) {
      merged.fonts[slot] = {label: "Default", stack: DEFAULT_FONT_STACKS[slot]};
    }
  }
  if (saved.baseFontSize && !draft.baseFontSize) merged.baseFontSize = DEFAULT_BASE_FONT_SIZE;

  return fontsCss(merged) + themeCss(merged);
}

/**
 * Re-applies the edits a draft made on top of `base` onto a newer saved theme, so a
 * save from elsewhere (another tab, a teammate, an agent) never silently reverts them.
 */
export function rebaseDraft(base: ThemeDoc, draft: ThemeDoc, saved: ThemeDoc): ThemeDoc {
  const result: ThemeDoc = structuredClone(saved);
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const apply = (target: Record<string, unknown>, from: Record<string, unknown>, to: Record<string, unknown>) => {
    for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
      if (same(from[key], to[key])) continue;
      if (to[key] === undefined) delete target[key];
      else target[key] = structuredClone(to[key]);
    }
  };

  for (const scope of SCOPES) apply(result[scope], base[scope], draft[scope]);
  apply(result.fonts, base.fonts, draft.fonts);
  apply(result as unknown as Record<string, unknown>, {baseFontSize: base.baseFontSize}, {baseFontSize: draft.baseFontSize});

  return result;
}

/** How many individual settings differ between two themes. */
export function countChanges(a: ThemeDoc, b: ThemeDoc): number {
  const differing = (x: Record<string, unknown>, y: Record<string, unknown>) =>
    [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(
      (key) => JSON.stringify(x[key]) !== JSON.stringify(y[key]),
    ).length;

  return (
    SCOPES.reduce((total, scope) => total + differing(a[scope], b[scope]), 0) +
    differing(a.fonts, b.fonts) +
    (a.baseFontSize === b.baseFontSize ? 0 : 1)
  );
}

/** Reads the color a CSS value actually renders as, for swatches and the color picker. */
export function resolveColor(value: string, probe: HTMLElement): {css: string; hex: string} {
  probe.style.color = "";
  probe.style.color = value;
  const css = getComputedStyle(probe).color;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  if (!context) return {css, hex: "#000000"};
  context.fillStyle = css;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;

  return {css, hex: `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`};
}

/** Resolves a length token (which may be a calc()) to a number in the given unit. */
export function resolveLength(value: string, unit: string, probe: HTMLElement): number {
  if (unit === "") return parseFloat(value);
  probe.style.width = "";
  probe.style.width = value;
  const px = parseFloat(getComputedStyle(probe).width);
  if (unit === "px") return px;

  return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
}
