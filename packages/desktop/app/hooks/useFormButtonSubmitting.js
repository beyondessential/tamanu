import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';

export const useFormButtonSubmitting = () => {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const { isSubmitting } = useFormikContext();

  useEffect(() => {
    let timer;
    if (isSubmitting) {
      // only show loading indicator when form is taking more than 1 second to submit
      timer = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isSubmitting]);

  return { isSubmitting, showLoadingIndicator };
};
