import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';
import { useMemo } from 'react';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const locationGroupsQuery = useLocationGroupsQuery();
  const { data: locationGroupData, error: locationGroupsError } = locationGroupsQuery;

  const usersQuery = useUsersQuery(
    { orderBy: 'displayName' },
    {
      // Add an 'unknown' user to the list for appointments that don't have a clinician
      select: ({ data }) => [...data, { id: 'unknown', displayName: 'Unknown' }],
    },
  );
  const { data: usersData, error: usersError } = usersQuery;

  const appointmentsQuery = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    locationGroupId: '',
    all: true,
  });
  const { data: appointmentsData, error: appointmentsError } = appointmentsQuery;

  const data = useMemo(() => {
    if (!appointmentsData?.data || appointmentsData.data.length === 0) return {};

    const cellData = lodashGroupBy(
      appointmentsData?.data,
      appointment => appointment[groupBy] || 'unknown',
    );

    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      return {
        cellData,
        headData: usersData.filter(user => !!cellData[user.id]),
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
  }, [appointmentsData?.data, groupBy, usersData, locationGroupData]);

  const error = locationGroupsError || usersError || appointmentsError;

  const isError = locationGroupsQuery.isError || usersQuery.isError || appointmentsQuery.isError;
  const isFetched =
    locationGroupsQuery.isFetched || usersQuery.isFetched || appointmentsQuery.isFetched;
  const isFetching =
    locationGroupsQuery.isFetching || usersQuery.isFetching || appointmentsQuery.isFetching;
  const isInitialLoading =
    locationGroupsQuery.isInitialLoading ||
    usersQuery.isInitialLoading ||
    appointmentsQuery.isInitialLoading;
  const isLoading =
    locationGroupsQuery.isLoading || usersQuery.isLoading || appointmentsQuery.isLoading;
  const isLoadingError =
    locationGroupsQuery.isLoadingError ||
    usersQuery.isLoadingError ||
    appointmentsQuery.isLoadingError;
  const isRefetching =
    locationGroupsQuery.isRefetching || usersQuery.isRefetching || appointmentsQuery.isRefetching;
  const isSuccess =
    locationGroupsQuery.isSuccess && usersQuery.isSuccess && appointmentsQuery.isSuccess;

  return {
    data,
    error,
    isError,
    isFetched,
    isFetching,
    isInitialLoading,
    isLoading,
    isLoadingError,
    isRefetching,
    isSuccess,
  };
};
