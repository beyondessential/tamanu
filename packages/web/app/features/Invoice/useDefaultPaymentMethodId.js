import { useEffect, useState } from 'react';

export const useDefaultPaymentMethodId = (paymentMethodSuggester) => {
  const [state, setState] = useState({ defaultMethodId: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    paymentMethodSuggester
      .fetchSuggestions('cash')
      .then(results => {
        if (!cancelled) {
          setState({
            defaultMethodId: results.length > 0 ? results[0].value : null,
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paymentMethodSuggester]);

  return state;
};
