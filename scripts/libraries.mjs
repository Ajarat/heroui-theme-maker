import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const LIBRARIES_DIR = path.join(ROOT, "libraries");
export const TEMPLATE_DIR = path.join(ROOT, "template");
const FIRST_PORT = 6101;

/** The files that make up a library's theme (not the engine that generates them). */
export const THEME_FILES = ["src/theme/theme.json", "src/theme/theme.css", "src/theme/fonts.css", "src/theme/custom.css"];

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

export function listLibraries() {
  if (!fs.existsSync(LIBRARIES_DIR)) return [];

  return fs
    .readdirSync(LIBRARIES_DIR, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(LIBRARIES_DIR, entry.name, "package.json")))
    .map(({name}) => {
      const dir = path.join(LIBRARIES_DIR, name);
      const pkg = readJson(path.join(dir, "package.json"));
      const theme = readJson(path.join(dir, "src/theme/theme.json"));
      const overrides =
        Object.keys(theme.common).length +
        Object.keys(theme.light).length +
        Object.keys(theme.dark).length +
        Object.keys(theme.fonts).length +
        (theme.baseFontSize ? 1 : 0);

      return {
        dir,
        heroui: pkg.dependencies["@heroui/react"],
        name,
        overrides,
        port: Number(pkg.scripts.dev.match(/--port (\d+)/)?.[1]),
      };
    })
    .sort((a, b) => a.port - b.port);
}

const validateName = (name) => {
  if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(name ?? "")) {
    throw new Error("Library names use lowercase letters, numbers and dashes, like todoapp9000");
  }
};

/** A copy, not a link: from here on the library shares nothing with the template or its siblings. */
export function createLibrary(name) {
  validateName(name);
  const dir = path.join(LIBRARIES_DIR, name);
  if (fs.existsSync(dir)) throw new Error(`${name} already exists`);

  const port = Math.max(FIRST_PORT - 1, ...listLibraries().map((library) => library.port)) + 1;

  fs.cpSync(TEMPLATE_DIR, dir, {
    filter: (source) => !source.split(path.sep).includes("node_modules"),
    recursive: true,
  });

  const manifest = path.join(dir, "package.json");
  fs.writeFileSync(
    manifest,
    fs.readFileSync(manifest, "utf8").replaceAll("__LIBRARY_NAME__", name).replaceAll("__PORT__", String(port)),
  );

  const install = spawnSync("pnpm", ["install", "--frozen-lockfile"], {cwd: dir, encoding: "utf8"});
  if (install.status !== 0) {
    fs.rmSync(dir, {force: true, recursive: true});
    throw new Error(`pnpm install failed for ${name}:\n${install.stderr || install.stdout}`);
  }

  return {name, port};
}

/** The only path by which anything crosses between libraries. `from` may be "template". */
export function copyBetween(from, to, paths = THEME_FILES) {
  validateName(to);
  const source = from === "template" ? TEMPLATE_DIR : path.join(LIBRARIES_DIR, from);
  const target = path.join(LIBRARIES_DIR, to);
  if (from !== "template") validateName(from);
  if (source === target) throw new Error("Pick two different libraries");
  if (!fs.existsSync(source)) throw new Error(`${from} doesn't exist`);
  if (!fs.existsSync(target)) throw new Error(`${to} doesn't exist`);

  for (const relative of paths) {
    const resolved = path.resolve(source, relative);
    if (!resolved.startsWith(source + path.sep)) throw new Error(`${relative} is outside ${from}`);
    if (!fs.existsSync(resolved)) throw new Error(`${relative} doesn't exist in ${from}`);
  }
  for (const relative of paths) {
    fs.cpSync(path.join(source, relative), path.join(target, relative), {recursive: true});
  }

  return paths;
}
