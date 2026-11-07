import type {Mode} from "@/theme/tokens";

/**
 * WCAG AA contrast audit of what actually renders: every visible text node in the
 * preview, in both modes, using the browser's computed colors. That covers colors
 * HeroUI derives with color-mix (soft chips, button text), not just the tokens.
 *
 * Every piece of text must reach 4.5:1, whatever its size. Disabled controls are
 * exempt, as in WCAG.
 */
export const AA_TEXT = 4.5;

export type ContrastIssue = {
  bg: string;
  element?: Element;
  fg: string;
  label: string;
  mode: Mode;
  ratio: number;
};

type Rgba = [number, number, number, number];

const cache = new Map<string, Rgba>();
let context: CanvasRenderingContext2D | null = null;

/** Any CSS color the browser understands (oklch, color-mix output, rgba…) → sRGB + alpha. */
function toRgba(css: string): Rgba {
  const cached = cache.get(css);
  if (cached) return cached;
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", {willReadFrequently: true});
  }
  if (!context) return [0, 0, 0, 1];
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "#000";
  context.fillStyle = css;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  const rgba: Rgba = [r, g, b, a / 255];
  cache.set(css, rgba);

  return rgba;
}

const over = ([r, g, b, a]: Rgba, [R, G, B]: Rgba): Rgba => [
  r * a + R * (1 - a),
  g * a + G * (1 - a),
  b * a + B * (1 - a),
  1,
];

const luminance = ([r, g, b]: Rgba) => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (a: Rgba, b: Rgba) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const toHex = ([r, g, b]: Rgba) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

const MEDIA = new Set(["IMG", "VIDEO", "CANVAS", "PICTURE", "IFRAME", "svg"]);

/** Composites backgrounds from the top of a stack down; null if a photo or gradient is in the way. */
function composite(stack: Element[]): Rgba | null {
  const layers: Rgba[] = [];
  for (const node of stack) {
    if (MEDIA.has(node.tagName)) return null; // Text over images can't be judged.
    const style = getComputedStyle(node);
    if (style.backgroundImage !== "none") return null;
    const color = toRgba(style.backgroundColor);
    const alpha = color[3] * parseFloat(style.opacity);
    if (alpha > 0) layers.push([color[0], color[1], color[2], alpha]);
    if (alpha >= 1) break;
  }
  let result: Rgba = [255, 255, 255, 1];
  for (const layer of layers.reverse()) result = over(layer, result);

  return result;
}

const ancestors = (element: Element) => {
  const chain: Element[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) chain.push(node);
  return chain;
};

/** A child painted behind its parent's text: negative z-index somewhere between it and the parent. */
const isBehind = (child: Element, parent: Element) => {
  for (let node: Element | null = child; node && node !== parent; node = node.parentElement) {
    if (parseInt(getComputedStyle(node).zIndex, 10) < 0) return true;
  }
  return false;
};

/**
 * What is actually painted under some text. Asks the browser by hit-testing at the
 * text's position, so it sees backgrounds drawn by other layers, like tab and
 * segment indicators, and photos behind text, which walking up the parents misses.
 */
function backgroundUnder(element: Element, rect: DOMRect | undefined): Rgba | null {
  if (!rect) return composite(ancestors(element));
  const x = rect.left + Math.min(rect.width / 2, 6);
  const y = rect.top + rect.height / 2;
  const stack = document.elementsFromPoint(x, y);
  const index = stack.indexOf(element);
  // Off-screen or covered by something else: fall back to the parents.
  if (index < 0) return composite(ancestors(element));
  // HeroUI's tab indicator is a child at z-index -1: listed above the tab, painted behind its text.
  const behindText = stack.slice(0, index).filter((node) => element.contains(node) && isBehind(node, element));

  return composite([...behindText, ...stack.slice(index)]);
}

/** Records scroll positions before the audit scrolls text into view, so they can be restored. */
function rememberScroll(element: Element, saved: Map<Element, [number, number]>) {
  for (let node: Element | null = element.parentElement; node; node = node.parentElement) {
    if (!saved.has(node) && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
      saved.set(node, [node.scrollLeft, node.scrollTop]);
    }
  }
  const root = document.scrollingElement;
  if (root && !saved.has(root)) saved.set(root, [root.scrollLeft, root.scrollTop]);
}

const opacityOf = (element: Element) => {
  let opacity = 1;
  for (let node: Element | null = element; node; node = node.parentElement) {
    opacity *= parseFloat(getComputedStyle(node).opacity);
  }
  return opacity;
};

const DISABLED = '[disabled], [aria-disabled="true"], [data-disabled="true"], [data-disabled=""], .label--disabled';

const isVisible = (element: Element) => {
  // Collapsed panels use hidden="until-found": still laid out, but unseen and not restyled.
  if (element.closest("[hidden]")) return false;
  if ("checkVisibility" in element && !element.checkVisibility({visibilityProperty: true})) return false;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
};

const snippet = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 32 ? `${clean.slice(0, 31)}…` : clean;
};

function check(fgCss: string, opacity: number, bg: Rgba, label: string, mode: Mode, element?: Element) {
  const raw = toRgba(fgCss);
  const fg = over([raw[0], raw[1], raw[2], raw[3] * opacity], bg);
  const ratio = contrastRatio(fg, bg);

  return ratio < AA_TEXT ? {bg: toHex(bg), element, fg: toHex(fg), label, mode, ratio} : null;
}

function auditRendered(root: Element, mode: Mode, scrolls: Map<Element, [number, number]>): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const seen = new Set<Element>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || seen.has(element) || !node.textContent?.trim()) continue;
    seen.add(element);
    if (element.closest(DISABLED) || !isVisible(element)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    let rect: DOMRect | undefined = range.getClientRects()[0];
    // Visually hidden text (sr-only) sits in a box clipped to a pixel or less.
    const box = element.getBoundingClientRect();
    if (!rect || rect.width < 2 || rect.height < 2 || box.width < 2 || box.height < 2) continue;
    const opacity = opacityOf(element);
    const color = getComputedStyle(element).color;
    if (toRgba(color)[3] * opacity < 0.05) continue; // Invisible text, e.g. a hidden year picker.
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) {
      rememberScroll(element, scrolls);
      element.scrollIntoView({block: "center", inline: "center"});
      rect = range.getClientRects()[0];
    }
    const bg = backgroundUnder(element, rect);
    if (!bg) continue;
    const issue = check(color, opacity, bg, snippet(element.textContent ?? ""), mode, element);
    if (issue) issues.push(issue);
  }

  for (const field of Array.from(root.querySelectorAll("input[placeholder], textarea[placeholder]"))) {
    if (field.closest(DISABLED) || !isVisible(field)) continue;
    const bg = composite(ancestors(field));
    if (!bg) continue;
    const placeholder = getComputedStyle(field, "::placeholder").color;
    const issue = check(placeholder, opacityOf(field), bg, `Placeholder “${snippet(field.getAttribute("placeholder") ?? "")}”`, mode, field);
    if (issue) issues.push(issue);
  }

  return issues;
}

/** States the preview doesn't show at rest: open overlays and hovered buttons. */
const TOKEN_PAIRS: [fg: string, bg: string, label: string][] = [
  ["--overlay-foreground", "--overlay", "Text in popovers, menus, modals"],
  ["--muted", "--overlay", "Muted text in overlays"],
  ["--muted", "--surface-secondary", "Muted text on Surface 2"],
  ["--muted", "--surface-tertiary", "Muted text on Surface 3"],
  ["--accent-foreground", "--accent-hover", "Accent button, hovered"],
  ["--accent-2-foreground", "--accent-2-hover", "Accent 2 button, hovered"],
  ["--success-foreground", "--success-hover", "Success button, hovered"],
  ["--warning-foreground", "--warning-hover", "Warning button, hovered"],
  ["--danger-foreground", "--danger-hover", "Danger button, hovered"],
  ["--default-foreground", "--default-hover", "Default button, hovered"],
  ["--field-foreground", "--field-background", "Text typed into fields"],
];

function auditTokens(probe: HTMLElement, mode: Mode): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  for (const [fg, bg, label] of TOKEN_PAIRS) {
    probe.style.color = `var(${fg})`;
    probe.style.backgroundColor = `var(${bg})`;
    const style = getComputedStyle(probe);
    if (toRgba(style.backgroundColor)[3] === 0) continue; // Token not defined in this library.
    const issue = check(style.color, 1, over(toRgba(style.backgroundColor), [255, 255, 255, 1]), label, mode);
    if (issue) issues.push(issue);
  }
  probe.style.color = probe.style.backgroundColor = "";

  return issues;
}

// Transitions and animations off so colors are read at rest (a paused entrance animation would
// freeze a tab indicator invisible); hit-testing on so pointer-events:none
// layers (tab indicators) still count as what's painted under the text.
const NO_TRANSITIONS =
  "*, *::before, *::after { transition: none !important; animation: none !important; pointer-events: auto !important; scroll-behavior: auto !important; }";

/**
 * Audits both modes by flipping the page's mode classes, measuring and flipping them
 * back, all before the next paint. Transitions are off while it measures, since a
 * color mid-animation would be misread.
 */
export function auditContrast(root: Element, probe: HTMLElement): ContrastIssue[] {
  const html = document.documentElement;
  const original = {className: html.className, theme: html.getAttribute("data-theme")};
  const freeze = document.createElement("style");
  freeze.textContent = NO_TRANSITIONS;
  document.head.append(freeze);

  const issues: ContrastIssue[] = [];
  const scrolls = new Map<Element, [number, number]>();
  try {
    for (const mode of ["light", "dark"] as const) {
      html.classList.remove("light", "dark");
      html.classList.add(mode);
      html.setAttribute("data-theme", mode);
      issues.push(...auditRendered(root, mode, scrolls), ...auditTokens(probe, mode));
    }
  } finally {
    for (const [node, [left, top]] of scrolls) node.scrollTo(left, top);
    html.className = original.className;
    if (original.theme === null) html.removeAttribute("data-theme");
    else html.setAttribute("data-theme", original.theme);
    getComputedStyle(html).color; // Settle styles before transitions come back.
    freeze.remove();
  }

  return issues.sort((a, b) => a.ratio - b.ratio);
}
