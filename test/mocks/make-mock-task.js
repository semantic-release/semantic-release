module.exports = function makeMockTask (sandbox) {
  var innerTask = function innerTask (next) {
    next(null);
  };
  var spiedInnerTask = sandbox.spy(innerTask);

  var mockTask = function () {
    return spiedInnerTask;
  };
  var spiedMockTask = sandbox.spy(mockTask);

  spiedMockTask.innerTask = spiedInnerTask;
  spiedMockTask.resetTask = function () {
    spiedInnerTask.reset();
    spiedMockTask.reset();
  };

  return spiedMockTask;
};
