import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  return [ref, isOverflowing];
};

export default useOverflow;
