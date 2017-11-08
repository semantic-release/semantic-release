module.exports = ({publishConfig, name}, conf) => {
  if (publishConfig && publishConfig.registry) {
    return publishConfig.registry;
  }

  if (name[0] !== '@') {
    return conf.get('registry') || 'https://registry.npmjs.org/';
  }

  return conf.get(`${name.split('/')[0]}/registry`) || conf.get('registry') || 'https://registry.npmjs.org/';
};
