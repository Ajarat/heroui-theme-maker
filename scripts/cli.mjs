import {copyBetween, createLibrary} from "./libraries.mjs";

const USAGE = `Usage:
  pnpm run new <name>                  Create a library from a fresh HeroUI install
  pnpm run copy <from> <to> [paths…]   Copy from one library to another
                                       (<from> may be "template"; default paths: the theme files)`;

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "new" && args.length === 1) {
    console.log(`Installing ${args[0]}…`);
    const {name, port} = createLibrary(args[0]);
    console.log(`Created libraries/${name} (Storybook on port ${port})`);
  } else if (command === "copy" && args.length >= 2) {
    const [from, to, ...paths] = args;
    const copied = copyBetween(from, to, paths.length ? paths : undefined);
    console.log(`Copied from ${from} to ${to}:\n  ${copied.join("\n  ")}`);
  } else {
    console.log(USAGE);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
