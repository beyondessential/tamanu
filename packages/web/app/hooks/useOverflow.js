import { useState, useRef, useLayoutEffect } from 'react';

const useOverflow = () => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef(null);

  const checkOverflow = () => {
    const element = ref.current;
    if (element) {
      setIsOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );
    }
  };

  useLayoutEffect(() => {
    checkOverflow();
  }, [ref]);

  return [ref, isOverflowing];
};

export default useOverflow;
