import { useMemo } from 'react';
import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const { data: locationGroupData } = useLocationGroupsQuery();
  const { data: userData } = useUsersQuery({
    orderBy: 'displayName',
  });
  const { data: appointmentData } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    clinicianId: '',
    locationGroupId: '',
  });

  return useMemo(() => {
    if (!appointmentData?.data || appointmentData?.data.length === 0) {
      return {};
    }
    if (groupBy === APPOINTMENT_GROUP_BY.AREA) {
      const cellData = lodashGroupBy(appointmentData?.data, 'locationGroupId');
      return {
        headData: locationGroupData.filter(locationGroup => !!cellData[locationGroup.id]),
        titleKey: 'name',
        cellData,
      };
    }
    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      const cellData = lodashGroupBy(appointmentData?.data, 'clinicianId');
      return {
        headData: userData.data.filter(user => !!cellData[user.id]),
        titleKey: 'displayName',
        cellData,
      };
    }
    return {};
  }, [appointmentData?.data, groupBy, locationGroupData, userData?.data]);
};
