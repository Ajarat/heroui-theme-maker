import {type ReactNode, useEffect, useState} from "react";

import {type FontChoice, SHADOW_PRESETS} from "@/theme/tokens";

export function Section({children, defaultOpen, title}: {children: ReactNode; defaultOpen?: boolean; title: string}) {
  return (
    <details className="ts-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="ts-section-body">{children}</div>
    </details>
  );
}

export function Subheading({children}: {children: ReactNode}) {
  return <h3 className="ts-subheading">{children}</h3>;
}

function ResetButton({label, onReset}: {label: string; onReset?: () => void}) {
  if (!onReset) return <span className="ts-reset-slot" />;

  return (
    <button aria-label={`Reset ${label}`} className="ts-reset" title="Back to HeroUI default" type="button" onClick={onReset}>
      ↺
    </button>
  );
}

export function ColorControl({
  hex,
  hint,
  label,
  onChange,
  onReset,
  swatch,
  value,
}: {
  hex: string;
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  swatch: string;
  value: string;
}) {
  const [text, setText] = useState(value);
  const invalid = text.trim() !== "" && !CSS.supports("color", text.trim());

  useEffect(() => setText(value), [value]);

  return (
    <div className="ts-row" title={hint}>
      <label aria-label={`${label} color picker`} className="ts-swatch" style={{background: swatch}}>
        <input type="color" value={hex} onChange={(event) => onChange(event.target.value)} />
      </label>
      <div className="ts-row-main">
        <span className="ts-label">
          {label}
          {onReset ? <i className="ts-dot" /> : null}
        </span>
        <input
          aria-invalid={invalid}
          aria-label={`${label} value`}
          className="ts-input ts-mono"
          spellCheck={false}
          value={text}
          onBlur={() => !invalid && text.trim() && text !== value && onChange(text.trim())}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        />
      </div>
      <ResetButton label={label} onReset={onReset} />
    </div>
  );
}

export function SliderControl({
  hint,
  label,
  max,
  min,
  onChange,
  onReset,
  step,
  unit,
  value,
}: {
  hint?: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  step: number;
  unit: string;
  value: number;
}) {
  const shown = Number.isFinite(value) ? Number(value.toFixed(3)) : min;

  return (
    <div className="ts-slider">
      <div className="ts-slider-head">
        <span className="ts-label" title={hint}>
          {label}
          {onReset ? <i className="ts-dot" /> : null}
        </span>
        <span className="ts-value ts-mono">
          {shown}
          {unit}
        </span>
        <ResetButton label={label} onReset={onReset} />
      </div>
      <input
        aria-label={label}
        className="ts-range"
        max={max}
        min={min}
        step={step}
        type="range"
        value={shown}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <p className="ts-hint">{hint}</p> : null}
    </div>
  );
}

export function SelectControl({
  label,
  onChange,
  onReset,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  options: {label: string; value: string}[];
  value: string;
}) {
  return (
    <div className="ts-field">
      <div className="ts-slider-head">
        <span className="ts-label">
          {label}
          {onReset ? <i className="ts-dot" /> : null}
        </span>
        <ResetButton label={label} onReset={onReset} />
      </div>
      <select aria-label={label} className="ts-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const OTHER = "__other__";

/** Accepts a bare URL or Google's whole <link> / @import embed snippet. */
const extractFontUrl = (input: string) => {
  const google = input.match(/https:\/\/fonts\.googleapis\.com\/css2?\?[^"'\s)<>]+/);

  return (google ? google[0] : input.trim()).replaceAll("&amp;", "&");
};

/** The family a Google Fonts URL defines. Any other name wouldn't match its @font-face rules. */
const googleFamily = (url: string) => {
  try {
    const {hostname, searchParams} = new URL(url);
    return hostname === "fonts.googleapis.com" ? searchParams.get("family")?.split(":")[0] : undefined;
  } catch {
    return undefined;
  }
};

export function FontControl({
  catalog,
  defaultLabel,
  fallback,
  label,
  onChange,
  value,
}: {
  catalog: FontChoice[];
  defaultLabel: string;
  fallback: string;
  label: string;
  onChange: (value: FontChoice | undefined) => void;
  value?: FontChoice;
}) {
  const [custom, setCustom] = useState(false);
  const known = value && catalog.some((font) => font.label === value.label);
  const showCustom = custom || Boolean(value && !known);
  const [familyText, setFamilyText] = useState(value?.label ?? "");
  const [urlText, setUrlText] = useState(value?.url ?? "");

  useEffect(() => {
    setFamilyText(value?.label ?? "");
    setUrlText(value?.url ?? "");
  }, [value]);

  const applyCustom = () => {
    const url = extractFontUrl(urlText);
    const family = (googleFamily(url) ?? familyText).trim().replaceAll('"', "");

    setUrlText(url);
    setFamilyText(family);
    // A URL without a family yet stays in the box until the family is filled in.
    if (family) onChange({label: family, stack: `"${family}", ${fallback}`, ...(url ? {url} : {})});
    else if (!url) onChange(undefined);
  };

  return (
    <div className="ts-field">
      <div className="ts-slider-head">
        <span className="ts-label">
          {label}
          {value ? <i className="ts-dot" /> : null}
        </span>
        <ResetButton
          label={label}
          onReset={
            value
              ? () => {
                  setCustom(false);
                  onChange(undefined);
                }
              : undefined
          }
        />
      </div>
      <select
        aria-label={label}
        className="ts-input"
        value={showCustom ? OTHER : (value?.label ?? "")}
        onChange={(event) => {
          const next = event.target.value;
          setCustom(next === OTHER);
          if (next !== OTHER) onChange(catalog.find((font) => font.label === next));
        }}
      >
        <option value="">{defaultLabel}</option>
        {catalog.map((font) => (
          <option key={font.label} value={font.label}>
            {font.label}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {showCustom ? (
        <div className="ts-custom-font">
          <input
            aria-label={`${label} stylesheet URL`}
            className="ts-input ts-mono"
            placeholder="Google Fonts URL (blank if installed)"
            spellCheck={false}
            value={urlText}
            onBlur={applyCustom}
            onChange={(event) => setUrlText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          />
          <input
            aria-label={`${label} family name`}
            className="ts-input"
            placeholder="Family name (filled in from a Google URL)"
            spellCheck={false}
            value={familyText}
            onBlur={applyCustom}
            onChange={(event) => setFamilyText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ShadowControl({
  label,
  onChange,
  onReset,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  value: string;
}) {
  const preset = SHADOW_PRESETS.find((option) => option.value === value);

  return (
    <SelectControl
      label={label}
      options={[...(preset ? [] : [{label: onReset ? "Custom" : "HeroUI default", value}]), ...SHADOW_PRESETS]}
      value={value}
      onChange={onChange}
      onReset={onReset}
    />
  );
}
