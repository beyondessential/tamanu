import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { notifyError } from '../utils';

export const useFormButtonLoadingIndicator = isLoading => {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  useEffect(() => {
    let timerShowLoadingIndicator;
    let timerCloseLoadingIndicator;

    if (timerShowLoadingIndicator) {
      clearTimeout(timerShowLoadingIndicator);
    }

    if (timerCloseLoadingIndicator) {
      clearTimeout(timerCloseLoadingIndicator);
    }

    if (isLoading) {
      // only show loading indicator when form is taking more than 1 second to submit
      timerShowLoadingIndicator = setTimeout(() => {
        if (isLoading) {
          setShowLoadingIndicator(true);
        }
      }, 1000);
    } else {
      // delay closing the loading indicator 1 second so that if it is in a Modal,
      // the Modal is closed first before loading indicator
      timerCloseLoadingIndicator = setTimeout(() => {
        setShowLoadingIndicator(false);
      }, 1000);
    }

    return () => {
      clearTimeout(timerShowLoadingIndicator);
      clearTimeout(timerCloseLoadingIndicator);
    };
  }, [isLoading]);

  return showLoadingIndicator;
};

export const useFormButtonSubmitting = () => {
  const formikContext = useFormikContext();

  if (process.env.NODE_ENV === 'development' && !formikContext) {
    notifyError('DEV WARNING: FormSubmitButton is being used in a non-form component');
  }

  const { isSubmitting } = formikContext || {};
  const showLoadingIndicator = useFormButtonLoadingIndicator(isSubmitting);

  return { isSubmitting, showLoadingIndicator };
};
