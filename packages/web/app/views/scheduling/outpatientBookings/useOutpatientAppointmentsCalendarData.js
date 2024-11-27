import { useMemo } from 'react';
import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const {
    data: locationGroupData,
    error: locationGroupsError,
    isLoading: isLocationGroupsLoading,
  } = useLocationGroupsQuery();

  const { data: userData, error: usersError, isLoading: isUsersLoading } = useUsersQuery(
    {
      orderBy: 'displayName',
    },
    {
      // Add an 'unknown' user to the list for appointments that don't have a clinician
      select: ({ data }) => [...data, { id: 'unknown', displayName: 'Unknown' }],
    },
  );

  const {
    data: appointmentData,
    error: appointmentError,
    isFetching: isFetchingAppointmentData,
  } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    locationGroupId: '',
    all: true,
  });

  const isLoading = isLocationGroupsLoading || isUsersLoading || isFetchingAppointmentData;
  const error = locationGroupsError || usersError || appointmentError;

  const data = useMemo(() => {
    if (!appointmentData?.data || appointmentData.data.length === 0) return {};

    const cellData = lodashGroupBy(
      appointmentData?.data,
      appointment => appointment[groupBy] || 'unknown',
    );

    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      return {
        cellData,
        headData: userData.filter(user => !!cellData[user.id]),
        titleKey: 'displayName',
      };
    }
    if (groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP) {
      return {
        cellData,
        headData: locationGroupData?.filter(group => !!cellData[group.id]),
        titleKey: 'name',
      };
    }
  }, [appointmentData?.data, groupBy, userData, locationGroupData]);

  return { data, isLoading, error };
};
