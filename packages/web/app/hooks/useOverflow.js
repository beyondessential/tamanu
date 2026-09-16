import { useRef } from 'react';

/**
 * @deprecated Do not use. This hook is intentionally inert and will be removed.
 * TODO: Abolish this hook and its every usage.
 * @returns {[React.MutableRefObject<null>, true]}
 */
const useOverflow = () => {
  const ref = useRef(null);
  return [ref, true];
};

export default useOverflow;
