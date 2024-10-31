import { useMemo } from 'react';
import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';
import { useAuth } from '../../../contexts/Auth';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const { facilityId } = useAuth();
  const {
    data: locationGroupData,
    error: locationGroupsError,
    isLoading: isLocationGroupsLoading,
  } = useLocationGroupsQuery({ facilityId });
  const { data: userData, error: usersError, isLoading: isUsersLoading } = useUsersQuery({
    orderBy: 'displayName',
  });
  const {
    data: appointmentData,
    error: appointmentError,
    isFetching: isFetchingAppointmentData,
  } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    clinicianId: '',
    locationGroupId: '',
  });

  const config = useMemo(
    () =>
      ({
        [APPOINTMENT_GROUP_BY.LOCATION_GROUP]: {
          titleKey: 'name',
          data: locationGroupData,
        },
        [APPOINTMENT_GROUP_BY.CLINICIAN]: {
          titleKey: 'displayName',
          data: userData.data,
        },
      }[groupBy]),
    [groupBy, locationGroupData, userData?.data],
  );

  const isLoading = isLocationGroupsLoading || isUsersLoading || isFetchingAppointmentData;
  const error = locationGroupsError || usersError || appointmentError;
  const data = useMemo(() => {
    if (!config || !appointmentData?.data || appointmentData.data.length === 0) {
      return {};
    }
    const { titleKey, data: baseData } = config[groupBy];
    const cellData = lodashGroupBy(appointmentData?.data, groupBy);
    const headData = baseData.filter(data => !!cellData[data.id]);
    return { headData, cellData, titleKey };
  }, [appointmentData.data, config, groupBy]);

  return { data, isLoading, error };
};
