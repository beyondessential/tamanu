import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { endOfDay, startOfDay } from 'date-fns';

export const useAppointments = options => {
  const api = useApi();

  return useQuery(['administeredVaccines', options], () =>
    api.get('appointments', options),
  );
};
