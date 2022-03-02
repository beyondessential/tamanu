import { useSelector } from 'react-redux';

// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

const facilitySelector = state => state.auth.server?.facility || {};

export const useFacility = () => useSelector(facilitySelector);
