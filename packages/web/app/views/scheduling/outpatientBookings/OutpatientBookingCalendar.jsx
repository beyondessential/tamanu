import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { omit } from 'lodash';
import React, { useState } from 'react';
import styled from 'styled-components';

import { BodyText, FormModal, SmallBodyText, TranslatedText } from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { useOutpatientAppointmentsCalendarData } from './useOutpatientAppointmentsCalendarData';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { useSendAppointmentEmail } from '../../../api/mutations';
import { toast } from 'react-toastify';

export const ColumnWrapper = styled(Box)`
  --column-width: 14rem;
  display: flex;
  flex-direction: column;
  inline-size: var(--column-width);
  min-block-size: max-content;

  > * {
    padding-inline: 0.5rem;
  }

  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  &:not(:first-child) {
    border-inline-start: var(--border-style);
  }
  &:last-child {
    border-inline-end: var(--border-style);
  }
`;

const HeadCellWrapper = styled(Box)`
  align-items: center;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
  inline-size: calc(var(--column-width) - 2px);
  inset-block-start: 0;
  justify-content: center;
  position: sticky;
  text-align: center;
`;

const AppointmentCountLabel = styled(SmallBodyText)`
  block-size: 1.1rem;
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
  color: ${Colors.midText};
  inline-size: 100%;
  letter-spacing: 0.02em;
  padding-inline: 0.8125rem;
  text-align: end;
`;

const AppointmentCount = styled('span')`
  color: ${Colors.darkestText};
  display: contents;
  font-weight: 500;
`;

const HeadCellTextWrapper = styled(Box)`
  block-size: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const HeadCellText = styled(BodyText)`
  -webkit-box-orient: vertical;
  display: -webkit-box;
  font-weight: 400;
  -webkit-line-clamp: 2;
  overflow: hidden;
  padding-inline: 0.5rem;
`;

const AppointmentColumnWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-block: 0.5rem;
`;

const StatusText = styled(BodyText)`
  color: ${Colors.primary};
  font-weight: 500;
  inline-size: 100%;
  padding-block-start: 1rem;
  text-align: center;
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
    <AppointmentCountLabel>
      {Number.isInteger(count) && (
        <>
          <AppointmentCount>{count}</AppointmentCount>&nbsp;
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
        </>
      )}
    </AppointmentCountLabel>
  </>
);

export const OutpatientBookingCalendar = ({ groupBy, selectedDate, onOpenDrawer, onCancel }) => {
  const {
    data: { headData = [], cellData, titleKey },
    isLoading,
    error,
  } = useOutpatientAppointmentsCalendarData({
    groupBy,
    selectedDate,
  });

  const [emailModalState, setEmailModalState] = useState(null);
  const { mutateAsync: sendAppointmentEmail } = useSendAppointmentEmail(
    emailModalState?.appointmentId,
    {
      onSuccess: () =>
        toast.success(
          <TranslatedText
            stringId="appointments.action.emailReminder.success"
            fallback="Email successfully sent"
          />,
        ),
      onError: () =>
        toast.error(
          <TranslatedText
            stringId="appointments.action.emailReminder.error"
            fallback="Error sending email"
          />,
        ),
    },
  );

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
                    {
                      label: (
                        <TranslatedText
                          stringId="appointments.action.emailAppointment"
                          fallback="Email appointment"
                        />
                      ),
                      action: () =>
                        setEmailModalState({ appointmentId: a.id, email: a.patient?.email }),
                    },
                  ]}
                />
              ))}
            </AppointmentColumnWrapper>
          </ColumnWrapper>
        );
      })}
      <FormModal
        title={<TranslatedText stringId="patient.email.title" fallback="Enter email address" />}
        open={!!emailModalState}
        onClose={() => setEmailModalState(null)}
      >
        <EmailAddressConfirmationForm
          onSubmit={async ({ email }) => {
            await sendAppointmentEmail(email);
            setEmailModalState(null);
          }}
          onCancel={() => setEmailModalState(null)}
          emailOverride={emailModalState?.email}
        />
      </FormModal>
    </Box>
  );
};
