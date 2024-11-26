import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';
import { useMemo } from 'react';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';
import { combineQueries } from '../../../api';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const locationGroupsQuery = useLocationGroupsQuery();
  const { data: locationGroupData } = locationGroupsQuery;

  const usersQuery = useUsersQuery(
    { orderBy: 'displayName' },
    {
      // Add an 'unknown' user to the list for appointments that don't have a clinician
      select: ({ data }) => [...data, { id: 'unknown', displayName: 'Unknown' }],
    },
  );
  const { data: usersData } = usersQuery;

  const appointmentsQuery = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    locationGroupId: '',
    all: true,
  });
  const { data: appointmentsData } = appointmentsQuery;

  const combinedQuery = combineQueries([locationGroupsQuery, usersQuery, appointmentsQuery]);

  combinedQuery.data = useMemo(() => {
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

  return combinedQuery;
};
