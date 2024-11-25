import React from 'react';
import { omit } from 'lodash';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import styled from 'styled-components';

import { Colors } from '../../../constants/index';
import {
  APPOINTMENT_CALENDAR_CLASS,
  BodyText,
  SmallBodyText,
  TranslatedText,
} from '../../../components';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { ThemedTooltip } from '../../../components/Tooltip';
import { useOutpatientAppointmentsCalendarData } from './useOutpatientAppointmentsCalendarData';

export const ColumnWrapper = styled(Box)`
  --column-width: 14rem;
  display: flex;
  flex-direction: column;
  inline-size: var(--column-width);
  min-block-size: max-content;
  > * {
    padding-inline: 0.5rem;
  }
  &:not(:first-child) {
    border-inline-start: max(0.0625rem, 1px) solid ${Colors.outline};
  }
  &:last-child {
    border-inline-end: max(0.0625rem, 1px) solid ${Colors.outline};
  }
`;

const HeadCellWrapper = styled(Box)`
  inset-block-start: 0;
  position: sticky;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inline-size: calc(var(--column-width) - 2px);
  text-align: center;
`;

const AppointmentNumber = styled(Box)`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  block-size: 1.1rem;
  gap: 0.25rem;
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
`;

const HeadCellTextWrapper = styled(Box)`
  block-size: 4rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const HeadCellText = styled(BodyText)`
  font-weight: 400;
  display: -webkit-box;
  padding-inline: 0.5rem;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AppointmentColumnWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  padding-block: 0.5rem;
  gap: 0.5rem;
`;

const StatusText = styled(BodyText)`
  inline-size: 100%;
  text-align: center;
  padding-block-start: 1rem;
  font-weight: 500;
  color: ${Colors.primary};
`;

const ErrorText = styled(StatusText)`
  color: ${Colors.alert};
`;

const LoadingSkeleton = styled(Skeleton).attrs({
  animation: 'wave',
  variant: 'rectangular',
  width: '100%',
  height: '100%',
  sx: { bgcolor: Colors.white },
})`
  ::after {
    animation-duration: 1s !important;
  }
`;

export const HeadCell = ({ title, count }) => (
  <>
    <HeadCellWrapper>
      <HeadCellTextWrapper>
        <ThemedTooltip title={title}>
          <HeadCellText>{title}</HeadCellText>
        </ThemedTooltip>
      </HeadCellTextWrapper>
    </HeadCellWrapper>
    <AppointmentNumber>
      {Number.isInteger(count) && (
        <>
          <SmallBodyText>{count}</SmallBodyText>
          <SmallBodyText color="textTertiary">
            {count === 1 ? (
              <TranslatedText
                stringId="appointments.outpatientCalendar.appointmentAbbreviation"
                fallback="appt"
              />
            ) : (
              <TranslatedText
                stringId="appointments.outpatientCalendar.appointmentAbbreviation.plural"
                fallback="appts"
              />
            )}
          </SmallBodyText>
        </>
      )}
    </AppointmentNumber>
  </>
);

export const OutpatientBookingCalendar = ({ groupBy, selectedDate, onOpenDrawer, onCancel }) => {
  const { data, isLoading, error } = useOutpatientAppointmentsCalendarData({
    groupBy,
    selectedDate,
  });
  const { headData = [], cellData, titleKey } = data;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorText>
        <TranslatedText
          stringId="appointments.outpatientCalendar.error"
          fallback="Failed to load appointments. Please try again."
        />
      </ErrorText>
    );
  }

  if (headData.length === 0) {
    return (
      <StatusText>
        <TranslatedText
          stringId="appointments.outpatientCalendar.noAppointments"
          fallback="No appointments to display. Please try adjusting the search filters."
        />
      </StatusText>
    );
  }
  return (
    <Box
      className={APPOINTMENT_CALENDAR_CLASS}
      display="flex"
      width="100%"
      overflow="auto"
      flex={1}
    >
      {headData?.map(cell => {
        console.log(cell);
        const appointments = cellData[cell.id];
        return (
          <ColumnWrapper className="column-wrapper" key={cell.id}>
            <HeadCell title={cell[titleKey]} count={appointments?.length || 0} />
            <AppointmentColumnWrapper>
              {appointments.map(a => (
                <AppointmentTile
                  key={a.id}
                  appointment={a}
                  onEdit={() => onOpenDrawer(a)}
                  onCancel={() => onCancel(a)}
                  actions={[
                    {
                      label: (
                        <TranslatedText
                          stringId="appointments.action.newAppointment"
                          fallback="New appointment"
                        />
                      ),
                      action: () => onOpenDrawer(omit(a, ['id', 'startTime', 'endTime'])),
                    },
                  ]}
                />
              ))}
            </AppointmentColumnWrapper>
          </ColumnWrapper>
        );
      })}
    </Box>
  );
};
