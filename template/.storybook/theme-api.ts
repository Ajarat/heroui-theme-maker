import fs from "node:fs/promises";
import path from "node:path";

import type {Connect, Plugin} from "vite";

import {GENERATED_HEADER, fontsCss, parseTheme, themeCss} from "../src/theme/tokens.ts";

const MAX_BODY_BYTES = 256 * 1024;

const readBody = (req: Connect.IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) reject(new Error("Theme is too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

/** Write-then-rename, so Vite's watcher never picks up a half-written stylesheet. */
const writeAtomic = async (file: string, contents: string) => {
  await fs.writeFile(`${file}.tmp`, contents);
  await fs.rename(`${file}.tmp`, file);
};

/**
 * Dev-server endpoint behind the Theme Studio's Update button. It only writes this
 * library's own src/theme files, so a save can never reach another library.
 */
export const themeApi = (): Plugin => ({
  name: "theme-studio-api",
  configureServer(server) {
    const dir = path.join(server.config.root, "src/theme");

    server.middlewares.use("/__theme", async (req, res) => {
      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      try {
        if (req.method === "GET") {
          send(200, parseTheme(JSON.parse(await fs.readFile(path.join(dir, "theme.json"), "utf8"))));
        } else if (req.method === "POST") {
          // A cross-site page can't send this content type without a CORS preflight, which we never approve.
          if (!req.headers["content-type"]?.startsWith("application/json")) {
            return send(415, {error: "Expected application/json"});
          }
          const theme = parseTheme(JSON.parse(await readBody(req)));
          await writeAtomic(path.join(dir, "theme.json"), `${JSON.stringify(theme, null, 2)}\n`);
          await writeAtomic(path.join(dir, "fonts.css"), GENERATED_HEADER + fontsCss(theme));
          await writeAtomic(path.join(dir, "theme.css"), GENERATED_HEADER + themeCss(theme));
          send(200, theme);
        } else {
          send(405, {error: "Method not allowed"});
        }
      } catch (error) {
        send(400, {error: error instanceof Error ? error.message : "Could not save theme"});
      }
    });
  },
});
