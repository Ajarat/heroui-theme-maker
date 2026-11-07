import {spawn} from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

import {copyBetween, createLibrary, listLibraries} from "../scripts/libraries.mjs";

const PORT = 6100;
const HOST = "127.0.0.1";
/** Storybooks this hub started, by library name. */
const running = new Map();

const isListening = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({host: HOST, port});
    socket.setTimeout(400);
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });

async function libraryStates() {
  return Promise.all(
    listLibraries().map(async ({dir, ...library}) => {
      const managed = running.has(library.name);
      const listening = await isListening(library.port);
      const state = listening ? "running" : managed ? "starting" : "stopped";

      return {...library, managed, state};
    }),
  );
}

function start(name) {
  const library = listLibraries().find((candidate) => candidate.name === name);
  if (!library) throw new Error(`${name} doesn't exist`);
  if (running.has(name)) return;

  // Own process group, so Stop takes down Storybook and not just the pnpm wrapper.
  const child = spawn("pnpm", ["run", "dev"], {cwd: library.dir, detached: true, stdio: ["ignore", "pipe", "pipe"]});
  const entry = {child, output: ""};
  const collect = (chunk) => {
    entry.output = (entry.output + chunk).slice(-4000);
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  child.on("error", (error) => {
    running.delete(name);
    console.error(`${name}: ${error.message}`);
  });
  child.on("exit", (code) => {
    running.delete(name);
    if (code) console.error(`${name} exited with code ${code}\n${entry.output}`);
  });
  running.set(name, entry);
}

function stop(name) {
  const entry = running.get(name);
  if (!entry) return;
  try {
    process.kill(-entry.child.pid, "SIGTERM");
  } catch {
    // Already gone.
  }
  running.delete(name);
}

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });

const server = http.createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, {"Content-Type": "application/json"});
    res.end(JSON.stringify(body));
  };

  // This server can create and overwrite files, so it only answers to itself.
  const hostname = (req.headers.host ?? "").split(":")[0];
  if (hostname !== HOST && hostname !== "localhost") return send(403, {error: "Forbidden"});

  const {pathname} = new URL(req.url, `http://${HOST}`);

  try {
    if (req.method === "GET" && pathname === "/") {
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
      return res.end(fs.readFileSync(path.join(import.meta.dirname, "index.html")));
    }
    if (req.method === "GET" && pathname === "/api/libraries") return send(200, await libraryStates());

    if (req.method === "POST") {
      if (!req.headers["content-type"]?.startsWith("application/json")) {
        return send(415, {error: "Expected application/json"});
      }
      const body = await readJson(req);
      if (pathname === "/api/libraries") return send(201, createLibrary(body.name));
      if (pathname === "/api/start") return send(200, start(body.name) ?? {});
      if (pathname === "/api/stop") return send(200, stop(body.name) ?? {});
      if (pathname === "/api/copy-theme") return send(200, {copied: copyBetween(body.from, body.to)});
    }
    send(404, {error: "Not found"});
  } catch (error) {
    send(400, {error: error.message});
  }
});

const shutdown = () => {
  for (const name of running.keys()) stop(name);
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, HOST, () => console.log(`Theme Maker hub: http://localhost:${PORT}`));
