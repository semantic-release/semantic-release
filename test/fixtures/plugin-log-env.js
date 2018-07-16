module.exports = (pluginConfig, {env, logger}) => {
  console.log(`Console: Exposing token ${env.MY_TOKEN}`);
  logger.log(`Log: Exposing token ${env.MY_TOKEN}`);
  logger.error(`Error: Console token ${env.MY_TOKEN}`);
  throw new Error(`Throw error: Exposing ${env.MY_TOKEN}`);
};
