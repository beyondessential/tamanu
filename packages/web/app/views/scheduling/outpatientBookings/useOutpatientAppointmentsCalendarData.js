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

  const isLoading = isLocationGroupsLoading || isUsersLoading || isFetchingAppointmentData;
  const error = locationGroupsError || usersError || appointmentError;

  const data = useMemo(() => {
    if (!appointmentData?.data || appointmentData.data.length === 0) return {};

    const cellData = lodashGroupBy(appointmentData?.data, groupBy);

    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      return {
        headData: userData?.data.filter(user => !!cellData[user.id]),
        cellData,
        titleKey: 'displayName',
      };
    }
    if (groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP) {
      return {
        headData: locationGroupData.filter(group => !!cellData[group.id]),
        cellData,
        titleKey: 'name',
      };
    }
  }, [appointmentData?.data, groupBy, userData?.data, locationGroupData]);

  return { data, isLoading, error };
};
