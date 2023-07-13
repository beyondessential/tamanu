import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';

export const useFormButtonSubmitting = () => {
  const [isButtonSubmitting, setIsButtonSubmitting] = useState(false);
  const { isSubmitting } = useFormikContext();

  useEffect(() => {
    let timer;
    if (isSubmitting) {
      timer = setTimeout(() => {
        setIsButtonSubmitting(true);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isSubmitting]);

  return isButtonSubmitting;
};
