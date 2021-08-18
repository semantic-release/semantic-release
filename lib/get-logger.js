const {Signale} = require('signale');
const figures = require('figures');

module.exports = ({stdout, stderr}) =>
  new Signale({
    config: {displayTimestamp: true, underlineMessage: false, displayLabel: false},
    disabled: false,
    interactive: false,
    scope: 'semantic-release',
    stream: [stdout],
    types: {
      error: {badge: figures.cross, color: 'red', label: '', stream: [stderr]},
      log: {badge: figures.info, color: 'magenta', label: '', stream: [stdout]},
      success: {badge: figures.tick, color: 'green', label: '', stream: [stdout]},
    },
  });
