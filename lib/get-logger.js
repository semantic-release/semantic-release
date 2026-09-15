import signale from "signale";
import figures from "figures";

const { Signale } = signale;

export default (context, disabled = false) => {
  const { stdout, stderr } = context;
  return new Signale({
    config: { displayTimestamp: true, underlineMessage: false, displayLabel: false },
    disabled: disabled,
    interactive: false,
    scope: "semantic-release",
    stream: [stdout],
    types: {
      error: { badge: figures.cross, color: "red", label: "", stream: [stderr] },
      log: { badge: figures.info, color: "magenta", label: "", stream: [stdout] },
      success: { badge: figures.tick, color: "green", label: "", stream: [stdout] },
      warn: { badge: figures.warning, color: "yellow", label: "", stream: [stderr] },
    },
  })
};
