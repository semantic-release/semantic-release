module.exports = () => {
  const error = new Error('a');
  error.errorProperty = 'errorProperty';
  throw error;
};
