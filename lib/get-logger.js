import signale from "signale";
import figures from "figures";

const { Signale } = signale;

export default ({ stdout, stderr }) =>
  new Signale({
    config: { displayTimestamp: true, underlineMessage: false, displayLabel: false },
    disabled: false,
    interactive: false,
    scope: "semantic-release",
    stream: [stdout],
    types: {
      error: { badge: figures.cross, color: "red", label: "", stream: [stderr] },
      log: { badge: figures.info, color: "magenta", label: "", stream: [stdout] },
      success: { badge: figures.tick, color: "green", label: "", stream: [stdout] },
    },
  });
