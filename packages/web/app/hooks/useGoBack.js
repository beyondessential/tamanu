import { useNavigate, useLocation } from 'react-router';

/**
 * Returns a callback that navigates back within the app.
 *
 * React Router sets location.key to 'default' for the initial history entry
 * (i.e. the page the app first loaded on). Calling navigate(-1) from there
 * would exit the app into whatever the browser had loaded before — potentially
 * an external site. When we're on the initial entry we navigate to `fallback`
 * instead.
 */
export const useGoBack = (fallback = '/') => {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
};
