import { useMemo } from 'react';
import { endOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';

import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

export const useOutpatientAppointmentsCalendarData = ({ groupBy, selectedDate }) => {
  const { data: locationGroupData } = useLocationGroupsQuery();
  const { data: userData } = useUsersQuery();
  const { data: appointmentData } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    clinicianId: '',
    locationGroupId: '',
  });

  return useMemo(() => {
    if (groupBy === APPOINTMENT_GROUP_BY.AREA) {
      return {
        headData: locationGroupData,
        titleKey: 'name',
        cellData: lodashGroupBy(appointmentData?.data, 'locationGroupId'),
      };
    }
    if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
      return {
        headData: userData?.data,
        titleKey: 'displayName',
        cellData: lodashGroupBy(appointmentData?.data, 'clinicianId'),
      };
    }
    return {};
  }, [appointmentData?.data, groupBy, locationGroupData, userData?.data]);
};
