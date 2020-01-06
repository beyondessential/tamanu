export function debounce(fn: Function, wait: number): Function {
  let timer: NodeJS.Timeout;
  return (...args: IArguments[]): void => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
