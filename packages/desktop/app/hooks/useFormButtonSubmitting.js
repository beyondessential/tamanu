import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';

export const useFormButtonLoadingIndicator = isLoading => {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  useEffect(() => {
    let timer;
    if (timer) {
      clearTimeout(timer);
    }

    if (isLoading) {
      // only show loading indicator when form is taking more than 1 second to submit
      timer = setTimeout(() => {
        if (isLoading) {
          setShowLoadingIndicator(true);
        }
      }, 1000);
    } else {
      setShowLoadingIndicator(false);
    }

    return () => clearTimeout(timer);
  }, [isLoading]);

  return showLoadingIndicator;
};

export const useFormButtonSubmitting = () => {
  const { isSubmitting } = useFormikContext();
  const showLoadingIndicator = useFormButtonLoadingIndicator(isSubmitting);

  return { isSubmitting, showLoadingIndicator };
};
