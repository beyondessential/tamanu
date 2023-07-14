import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';

export const useFormButtonSubmitting = () => {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const { isSubmitting } = useFormikContext();
  // const isSubmitting = true;

  useEffect(() => {
    let timer;
    if (isSubmitting) {
      timer = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isSubmitting]);

  return { isSubmitting, showLoadingIndicator };
};
