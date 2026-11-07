import raw from "@heroui/styles/themes/default/variables.css?raw";

import extensionsRaw from "@/theme/extensions.css?raw";

export type Defaults = Record<"common" | "light" | "dark", Record<string, string>>;

/**
 * Stock values, read from the HeroUI version this library has installed rather
 * than copied here, so they stay correct when the library upgrades HeroUI.
 */
export function readDefaults(): Defaults {
  const defaults: Defaults = {common: {}, light: {}, dark: {}};
  const sheet = new CSSStyleSheet();
  // Strip @theme: it's Tailwind syntax, not CSS.
  sheet.replaceSync(raw + extensionsRaw.replace(/@theme inline \{[^}]*\}/, ""));

  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSLayerBlockRule) visit(rule.cssRules);
      if (!(rule instanceof CSSStyleRule)) continue;

      const selector = rule.selectorText;
      // Only theme-level blocks; component rules also set custom properties.
      if (!/:root|\.light|\.dark/.test(selector) || selector.includes("data-vibrant-palette")) continue;
      const scope = selector.includes(".dark") ? "dark" : selector.includes(".light") ? "light" : "common";

      for (const name of Array.from(rule.style)) {
        if (name.startsWith("--")) {
          defaults[scope][name] = rule.style.getPropertyValue(name).replace(/\s+/g, " ").trim();
        }
      }
    }
  };
  visit(sheet.cssRules);

  return defaults;
}
