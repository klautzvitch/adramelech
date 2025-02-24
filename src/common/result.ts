type Success<T> = {
  data: T;
  error?: never;
};

type Failure<E> = {
  data?: never;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;
