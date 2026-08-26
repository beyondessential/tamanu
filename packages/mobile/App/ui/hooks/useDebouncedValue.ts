import { useEffect, useState } from 'react';

/**
 * Returns `value`, but withholds changes to it until `delay` milliseconds have passed without a
 * further change. Use it to keep a rapidly changing value (typically text being typed) from driving
 * expensive work such as a database query on every change.
 *
 * The initial value is returned immediately, so a first load isn't held up by the delay.
 */
export default function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
