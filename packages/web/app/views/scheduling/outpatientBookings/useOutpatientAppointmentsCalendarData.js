import { endOfDay, startOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';
import { useMemo } from 'react';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { combineQueries } from '../../../api';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { useOutpatientAppointmentsContext } from '../../../contexts/OutpatientAppointments';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

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

  const { filters } = useOutpatientAppointmentsContext();
  const appointmentsQuery = useOutpatientAppointmentsQuery(
    {
      after: toDateTimeString(startOfDay(selectedDate)),
      before: toDateTimeString(endOfDay(selectedDate)),
      all: true,
      ...filters,
      // Providing [] here omits the `?locationGroupId=` param, but the `GET /appointments` relies
      // on its presence/absence to determine whether we are querying for location bookings or
      // outpatient appointments
      locationGroupId: filters?.locationGroupId?.length === 0 ? '' : filters.locationGroupId,
    },
    { enabled: !!filters },
  );
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
