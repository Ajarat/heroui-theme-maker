import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {UPDATE_GLOBALS} from "storybook/internal/core-events";
import {addons} from "storybook/preview-api";

import pkg from "../../package.json";

import {
  COLOR_GROUPS,
  DEFAULT_BASE_FONT_SIZE,
  DENSITY_TOKENS,
  FONT_CATALOG,
  type FontChoice,
  type FontSlot,
  MOTION_TOKENS,
  type Mode,
  SHADOW_TOKENS,
  SHAPE_TOKENS,
  type Scope,
  type ThemeDoc,
  emptyTheme,
} from "@/theme/tokens";

import {ColorControl, FontControl, Section, SelectControl, ShadowControl, SliderControl, Subheading} from "./controls";
import {AA_TEXT, type ContrastIssue, auditContrast} from "./contrast";
import {readDefaults} from "./defaults";
import {countChanges, draftCss, rebaseDraft, resolveColor, resolveLength} from "./draft";
import {ComponentPreview} from "./preview";

import "./studio.css";

const DRAFT_KEY = `theme-studio-draft:${pkg.name}`;
const STYLE_ID = "theme-studio-draft";

const FONT_FALLBACKS: Record<FontSlot, string> = {
  heading: "ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, monospace",
  sans: "ui-sans-serif, system-ui, sans-serif",
};

/**
 * A draft is stored with the saved theme it started from, so it can be rebased later.
 * Drafts stored before that existed have no base and are restored as they are.
 */
type StoredDraft = {base: ThemeDoc | null; draft: ThemeDoc};

const readStoredDraft = (): StoredDraft | null => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    if (stored?.draft) return {base: stored.base ?? null, draft: stored.draft};
    return stored?.version === 1 ? {base: null, draft: stored} : null;
  } catch {
    return null;
  }
};

const storeDraft = (stored: StoredDraft | null) => {
  try {
    if (stored) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Losing the draft across a story switch is acceptable.
  }
};

const fetchSaved = async (): Promise<ThemeDoc> => {
  const response = await fetch("/__theme");
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  return body;
};

type Status = {kind: "idle" | "saving" | "saved"} | {kind: "error"; message: string};

export function Studio({mode}: {mode: Mode}) {
  const defaults = useMemo(readDefaults, []);
  const [saved, setSaved] = useState<ThemeDoc | null>(null);
  const [draft, setDraft] = useState<ThemeDoc>(emptyTheme);
  const [status, setStatus] = useState<Status>({kind: "idle"});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [measured, setMeasured] = useState<{
    colors: Record<string, {css: string; hex: string}>;
    lengths: Record<string, number>;
  }>({colors: {}, lengths: {}});
  const [cssRevision, setCssRevision] = useState(0);
  const probeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  /** null while an audit is pending, so Update can't race it. */
  const [issues, setIssues] = useState<ContrastIssue[] | null>(null);
  // True from an Update until the new theme.css has actually reached the page.
  const awaitingNewCss = useRef(false);

  const savedRef = useRef<ThemeDoc | null>(null);
  savedRef.current = saved;

  useEffect(() => {
    fetchSaved()
      .then((body) => {
        const stored = readStoredDraft();
        setSaved(body);
        setDraft(stored ? (stored.base ? rebaseDraft(stored.base, stored.draft, body) : stored.draft) : body);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  /** Picks up saves made outside this tab, keeping this tab's unsaved edits on top. */
  const syncSaved = useCallback(async () => {
    const previous = savedRef.current;
    if (!previous) return;
    const next = await fetchSaved().catch(() => null);
    if (!next || JSON.stringify(next) === JSON.stringify(previous)) return;
    setDraft((current) => rebaseDraft(previous, current, next));
    setSaved(next);
  }, []);

  const changes = saved ? countChanges(draft, saved) : 0;

  // Apply the draft to the whole preview iframe, then measure what it resolved to.
  useLayoutEffect(() => {
    if (!saved) return;

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
    }
    // Dropping the draft styles early would flash the previous theme and measure stale values.
    if (!awaitingNewCss.current) style.textContent = draftCss(draft, saved, defaults);
    document.head.append(style); // Always last, so it wins over theme.css.

    const probe = probeRef.current;
    if (!probe) return;
    const colors: typeof measured.colors = {};
    for (const token of COLOR_GROUPS.flatMap((group) => group.tokens)) {
      colors[token.name] = resolveColor(`var(${token.name})`, probe);
    }
    const lengths: typeof measured.lengths = {};
    for (const token of [...SHAPE_TOKENS, ...DENSITY_TOKENS]) {
      lengths[token.name] = resolveLength(`var(${token.name})`, token.unit, probe);
    }
    setMeasured({colors, lengths});
  }, [draft, saved, mode, defaults, cssRevision]);

  // Contrast audit of the rendered preview in both modes, debounced while sliders move.
  useEffect(() => {
    if (!saved) return;
    setIssues(null);
    const timer = window.setTimeout(() => {
      if (canvasRef.current && probeRef.current) setIssues(auditContrast(canvasRef.current, probeRef.current));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [draft, saved, cssRevision]);

  const setMode = (next: Mode) => addons.getChannel().emit(UPDATE_GLOBALS, {globals: {theme: next}});

  const locate = (issue: ContrastIssue) => {
    if (issue.mode !== mode) setMode(issue.mode);
    const element = issue.element;
    if (!element) return;
    window.setTimeout(() => {
      element.scrollIntoView({behavior: "smooth", block: "center"});
      element.classList.add("ts-flag");
      window.setTimeout(() => element.classList.remove("ts-flag"), 2400);
    }, 50);
  };

  const onCssUpdated = useCallback(() => {
    awaitingNewCss.current = false;
    setCssRevision((revision) => revision + 1);
    void syncSaved();
  }, [syncSaved]);

  useEffect(() => {
    import.meta.hot?.on("vite:afterUpdate", onCssUpdated);

    return () => import.meta.hot?.off("vite:afterUpdate", onCssUpdated);
  }, [onCssUpdated]);

  // Leaving the Studio drops the draft styles, so other stories show the saved theme.
  useEffect(() => () => document.getElementById(STYLE_ID)?.remove(), []);

  useEffect(() => {
    if (saved) storeDraft(changes > 0 ? {base: saved, draft} : null);
  }, [changes, draft, saved]);

  const setToken = useCallback((scope: Scope, name: string, value: string | undefined) => {
    setStatus({kind: "idle"});
    setDraft((current) => {
      const tokens = {...current[scope]};
      if (value === undefined) delete tokens[name];
      else tokens[name] = value;
      return {...current, [scope]: tokens};
    });
  }, []);

  const setFont = (slot: FontSlot, font: FontChoice | undefined) => {
    setStatus({kind: "idle"});
    setDraft((current) => {
      const fonts = {...current.fonts};
      if (font) fonts[slot] = font;
      else delete fonts[slot];
      return {...current, fonts};
    });
  };

  const setBaseFontSize = (value: string | undefined) => {
    setStatus({kind: "idle"});
    setDraft((current) => {
      const next = {...current};
      if (value) next.baseFontSize = value;
      else delete next.baseFontSize;
      return next;
    });
  };

  const update = async () => {
    if (issues === null || issues.length > 0) return;
    setStatus({kind: "saving"});
    try {
      const response = await fetch("/__theme", {
        body: JSON.stringify(draft),
        headers: {"Content-Type": "application/json"},
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      awaitingNewCss.current = true;
      setSaved(body);
      setDraft(body);
      setStatus({kind: "saved"});
      window.setTimeout(onCssUpdated, 3000); // In case hot reload never reports back.
    } catch (error) {
      setStatus({kind: "error", message: error instanceof Error ? error.message : "Could not save"});
    }
  };

  const tokenProps = (scope: Scope, name: string) => ({
    onReset: name in draft[scope] ? () => setToken(scope, name, undefined) : undefined,
    value: draft[scope][name] ?? defaults[scope][name] ?? "",
  });


  return (
    <div className="ts-root">
      <aside className="ts-panel">
        <header className="ts-header">
          <div>
            <p className="ts-eyebrow">Theme Studio</p>
            <h2 className="ts-title">{pkg.name}</h2>
          </div>
          <div aria-label="Preview mode" className="ts-mode" role="group">
            {(["light", "dark"] as const).map((option) => (
              <button aria-pressed={mode === option} key={option} type="button" onClick={() => setMode(option)}>
                {option === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </header>

        <div className="ts-scroll">
          {loadError ? <p className="ts-error">Could not load theme.json: {loadError}</p> : null}

          <Section defaultOpen title="Typography">
            <FontControl
              catalog={FONT_CATALOG.sans}
              defaultLabel="System default"
              fallback={FONT_FALLBACKS.sans}
              label="Body font"
              value={draft.fonts.sans}
              onChange={(font) => setFont("sans", font)}
            />
            <FontControl
              catalog={FONT_CATALOG.heading}
              defaultLabel="Same as body"
              fallback={FONT_FALLBACKS.heading}
              label="Heading font"
              value={draft.fonts.heading}
              onChange={(font) => setFont("heading", font)}
            />
            <FontControl
              catalog={FONT_CATALOG.mono}
              defaultLabel="System default"
              fallback={FONT_FALLBACKS.mono}
              label="Code font"
              value={draft.fonts.mono}
              onChange={(font) => setFont("mono", font)}
            />
            <SliderControl
              hint="Scales text, spacing and radii together"
              label="Base font size"
              max={20}
              min={12}
              step={0.5}
              unit="px"
              value={parseFloat(draft.baseFontSize ?? DEFAULT_BASE_FONT_SIZE)}
              onChange={(value) => setBaseFontSize(`${value}px`)}
              onReset={draft.baseFontSize ? () => setBaseFontSize(undefined) : undefined}
            />
          </Section>

          <Section defaultOpen title="Shape">
            {SHAPE_TOKENS.map((token) => (
              <SliderControl
                hint={token.hint}
                key={token.name}
                label={token.label}
                max={token.max}
                min={token.min}
                step={token.step}
                unit={token.unit}
                value={measured.lengths[token.name] ?? token.min}
                onChange={(value) => setToken("common", token.name, `${value}${token.unit}`)}
                onReset={tokenProps("common", token.name).onReset}
              />
            ))}
          </Section>

          <Section defaultOpen title={`Colors · ${mode === "dark" ? "Dark" : "Light"}`}>
            {COLOR_GROUPS.map((group) => (
              <div key={group.label}>
                <Subheading>{group.label}</Subheading>
                {group.tokens.map((token) => {
                  const scope = token.scope === "common" ? "common" : mode;
                  const resolved = measured.colors[token.name];

                  return (
                    <ColorControl
                      hex={resolved?.hex ?? "#000000"}
                      hint={token.hint}
                      key={token.name}
                      label={token.label}
                      swatch={resolved?.css ?? "transparent"}
                      onChange={(value) => setToken(scope, token.name, value)}
                      {...tokenProps(scope, token.name)}
                    />
                  );
                })}
              </div>
            ))}
          </Section>

          <Section title={`Shadows · ${mode === "dark" ? "Dark" : "Light"}`}>
            {SHADOW_TOKENS.map((token) => (
              <ShadowControl
                key={token.name}
                label={token.label}
                onChange={(value) => setToken(mode, token.name, value)}
                {...tokenProps(mode, token.name)}
              />
            ))}
          </Section>

          <Section title="Density and motion">
            {DENSITY_TOKENS.map((token) => (
              <SliderControl
                hint={token.hint}
                key={token.name}
                label={token.label}
                max={token.max}
                min={token.min}
                step={token.step}
                unit={token.unit}
                value={measured.lengths[token.name] ?? token.min}
                onChange={(value) => setToken("common", token.name, `${value}${token.unit}`)}
                onReset={tokenProps("common", token.name).onReset}
              />
            ))}
            {MOTION_TOKENS.map((token) => (
              <SelectControl
                key={token.name}
                label={token.label}
                options={token.options}
                onChange={(value) => setToken("common", token.name, value)}
                {...tokenProps("common", token.name)}
              />
            ))}
          </Section>
        </div>

        <footer className="ts-footer">
          {issues && issues.length > 0 ? (
            <details className="ts-issues">
              <summary>
                {issues.length} contrast {issues.length === 1 ? "issue" : "issues"}: text needs {AA_TEXT}:1
              </summary>
              <ul>
                {issues.map((issue, index) => (
                  <li key={index}>
                    <button type="button" onClick={() => locate(issue)}>
                      <span aria-hidden className="ts-pair" style={{background: issue.bg, color: issue.fg}}>
                        Aa
                      </span>
                      <span className="ts-issue-label">{issue.label}</span>
                      <span className="ts-issue-meta">
                        {issue.ratio.toFixed(2)} · {issue.mode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="ts-contrast-ok">{issues ? `All text meets AA (${AA_TEXT}:1) in light and dark` : "Checking contrast…"}</p>
          )}
          <p aria-live="polite" className="ts-status" data-kind={status.kind}>
            {status.kind === "error"
              ? `Not saved: ${status.message}`
              : status.kind === "saving"
                ? "Saving…"
                : status.kind === "saved"
                  ? `Saved to ${pkg.name} and applied to every story`
                  : changes > 0
                    ? `${changes} unsaved ${changes === 1 ? "change" : "changes"}`
                    : "No unsaved changes"}
          </p>
          <button
            className="ts-update"
            disabled={!saved || changes === 0 || status.kind === "saving" || issues === null || issues.length > 0}
            type="button"
            onClick={update}
          >
            {issues && issues.length > 0 ? "Fix contrast to update" : `Update ${pkg.name}`}
          </button>
          <div className="ts-secondary">
            <button
              disabled={changes === 0}
              type="button"
              onClick={() => {
                if (saved) setDraft(saved);
                setStatus({kind: "idle"});
              }}
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(emptyTheme());
                setStatus({kind: "idle"});
              }}
            >
              Start from HeroUI defaults
            </button>
          </div>
        </footer>
      </aside>

      <main className="ts-canvas" ref={canvasRef}>
        <ComponentPreview />
      </main>
      <div aria-hidden className="ts-probe" ref={probeRef} />
    </div>
  );
}
