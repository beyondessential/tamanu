import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store';

// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

export const useAuth = () => {
  const dispatch = useDispatch();

  return {
    ...useSelector(state => ({
      currentUser: state.auth.user,
      facility: state.auth.server?.facility || {},
    })),
    onLogout: () => dispatch(logout()),
  };
};
