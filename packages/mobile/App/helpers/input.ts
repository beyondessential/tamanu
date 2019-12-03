export function debounce(fn: Function, wait: number) {
  let timer: any;
  return (...args: IArguments[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
