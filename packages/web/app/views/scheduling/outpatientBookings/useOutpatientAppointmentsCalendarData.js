import { groupBy as lodashGroupBy } from 'lodash';
import { useMemo } from 'react';

import { toDateString } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { combineQueries } from '../../../api';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { useOutpatientAppointmentsContext } from '../../../contexts/OutpatientAppointments';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const { getDayBoundaries } = useDateTimeFormat();
  const locationGroupsQuery = useLocationGroupsQuery(null, { keepPreviousData: true });
  const { data: locationGroupData } = locationGroupsQuery;

  const usersQuery = useUsersQuery(
    { orderBy: 'displayName' },
    {
      // Add an 'unknown' user to the list for appointments that don't have a clinician
      select: ({ data }) => [...data, { id: 'unknown', displayName: 'Unknown' }],
      keepPreviousData: true,
    },
  );
  const { data: usersData } = usersQuery;

  const { filters } = useOutpatientAppointmentsContext();
  const dateString = toDateString(selectedDate);
  const { start, end } = getDayBoundaries(dateString);
  const appointmentsQuery = useOutpatientAppointmentsQuery(
    {
      after: start,
      before: end,
      all: true,
      ...filters,
    },
    {
      /** A null `filters` is valid (i.e. when a user has never used this filter before) */
      enabled: filters !== undefined,
      keepPreviousData: true,
    },
  );
  const { data: appointmentsData } = appointmentsQuery;

  const combinedQuery = combineQueries([locationGroupsQuery, usersQuery, appointmentsQuery]);

  combinedQuery.data = useMemo(() => {
    if (!appointmentsData?.data || appointmentsData.data.length === 0) return {};

    const cellData = lodashGroupBy(
      appointmentsData?.data,
      (appointment) => appointment[groupBy] || 'unknown',
    );

    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      return {
        cellData,
        headData: usersData.filter((user) => !!cellData[user.id]),
      };
    }
    if (groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP) {
      return {
        cellData,
        headData: locationGroupData?.filter((group) => !!cellData[group.id]),
      };
    }
    if (!groupBy) {
      return {};
    }
  }, [appointmentsData?.data, groupBy, usersData, locationGroupData]);

  return combinedQuery;
};
