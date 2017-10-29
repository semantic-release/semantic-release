module.exports = function(config, options, cb) {
  const error = new Error('a');
  error.errorProperty = 'errorProperty';
  cb(error);
};
