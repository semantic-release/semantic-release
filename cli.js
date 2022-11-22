import util from "node:util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import hideSensitive from "./lib/hide-sensitive.js";

const stringList = {
  type: "string",
  array: true,
  coerce: (values) =>
    values.length === 1 && values[0].trim() === "false"
      ? []
      : values.reduce((values, value) => values.concat(value.split(",").map((value) => value.trim())), []),
};

export default async () => {
  const cli = yargs(hideBin(process.argv))
    .command("$0", "Run automated package publishing", (yargs) => {
      yargs.demandCommand(0, 0).usage(`Run automated package publishing

Usage:
  semantic-release [options] [plugins]`);
    })
    .option("b", { alias: "branches", describe: "Git branches to release from", ...stringList, group: "Options" })
    .option("r", { alias: "repository-url", describe: "Git repository URL", type: "string", group: "Options" })
    .option("t", { alias: "tag-format", describe: "Git tag format", type: "string", group: "Options" })
    .option("p", { alias: "plugins", describe: "Plugins", ...stringList, group: "Options" })
    .option("e", { alias: "extends", describe: "Shareable configurations", ...stringList, group: "Options" })
    .option("ci", { describe: "Toggle CI verifications", type: "boolean", group: "Options" })
    .option("verify-conditions", { ...stringList, group: "Plugins" })
    .option("analyze-commits", { type: "string", group: "Plugins" })
    .option("verify-release", { ...stringList, group: "Plugins" })
    .option("generate-notes", { ...stringList, group: "Plugins" })
    .option("prepare", { ...stringList, group: "Plugins" })
    .option("publish", { ...stringList, group: "Plugins" })
    .option("success", { ...stringList, group: "Plugins" })
    .option("fail", { ...stringList, group: "Plugins" })
    .option("debug", { describe: "Output debugging information", type: "boolean", group: "Options" })
    .option("d", { alias: "dry-run", describe: "Skip publishing", type: "boolean", group: "Options" })
    .option("h", { alias: "help", group: "Options" })
    .strict(false)
    .exitProcess(false);

  try {
    const { help, version, ...options } = cli.parse(process.argv.slice(2));

    if (Boolean(help) || Boolean(version)) {
      return 0;
    }

    if (options.debug) {
      // Debug must be enabled before other requires in order to work
      (await import("debug")).default.enable("semantic-release:*");
    }

    await (await import("./index.js")).default(options);
    return 0;
  } catch (error) {
    if (error.name !== "YError") {
      process.stderr.write(hideSensitive(process.env)(util.inspect(error, { colors: true })));
    }

    return 1;
  }
};
