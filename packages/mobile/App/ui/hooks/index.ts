import { useContext } from 'react';
import { BackendContext } from '~/ui/contexts/BackendContext';

export const useBackend = () => useContext(BackendContext);
