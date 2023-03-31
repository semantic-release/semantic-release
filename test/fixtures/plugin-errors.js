import AggregateError from "aggregate-error";

export default () => {
  throw new AggregateError([new Error("a"), new Error("b")]);
};
