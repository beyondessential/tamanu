export interface Result<T> {
  data: T;
  error: Error | null;
}
