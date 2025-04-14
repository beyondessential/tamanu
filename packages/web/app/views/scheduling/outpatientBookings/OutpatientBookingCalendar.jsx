import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import React, { useState } from 'react';
import styled from 'styled-components';

import {
  BodyText,
  FormModal,
  SmallBodyText,
  TranslatedReferenceData,
  TranslatedText,
} from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { useOutpatientAppointmentsCalendarData } from './useOutpatientAppointmentsCalendarData';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { useSendAppointmentEmail } from '../../../api/mutations';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/Auth';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';
import { useOutpatientAppointmentsContext } from '../../../contexts/OutpatientAppointments';

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
    <HeadCellWrapper data-testid="headcellwrapper-zp1o">
      <HeadCellTextWrapper data-testid="headcelltextwrapper-pgoj">
        <ThemedTooltip title={title} data-testid="themedtooltip-rz38">
          <HeadCellText data-testid="headcelltext-m9ej">{title}</HeadCellText>
        </ThemedTooltip>
      </HeadCellTextWrapper>
    </HeadCellWrapper>
    <AppointmentCountLabel data-testid="appointmentcountlabel-pnn0">
      {Number.isInteger(count) && (
        <>
          <AppointmentCount data-testid="appointmentcount-d4z0">{count}</AppointmentCount>&nbsp;
          {count === 1 ? (
            <TranslatedText
              stringId="appointments.outpatientCalendar.appointmentAbbreviation"
              fallback="appt"
              data-testid="translatedtext-8hjq"
            />
          ) : (
            <TranslatedText
              stringId="appointments.outpatientCalendar.appointmentAbbreviation.plural"
              fallback="appts"
              data-testid="translatedtext-rpon"
            />
          )}
        </>
      )}
    </AppointmentCountLabel>
  </>
);

export const OutpatientBookingCalendar = ({
  selectedDate,
  onCreateFromExisting,
  onModify,
  onCancel,
}) => {
  const { ability } = useAuth();
  const { groupBy } = useOutpatientAppointmentsContext();
  const {
    data: { headData = [], cellData },
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
            data-testid="translatedtext-jxz5"
          />,
        ),
      onError: () =>
        toast.error(
          <TranslatedText
            stringId="appointments.action.emailReminder.error"
            fallback="Error sending email"
            data-testid="translatedtext-ov72"
          />,
        ),
    },
  );

  if (isLoading) {
    return <LoadingSkeleton data-testid="loadingskeleton-2rfj" />;
  }

  if (error) {
    return (
      <ErrorText data-testid="errortext-9qcv">
        <TranslatedText
          stringId="appointments.outpatientCalendar.error"
          fallback="Failed to load appointments. Please try again."
          data-testid="translatedtext-f5nc"
        />
      </ErrorText>
    );
  }

  if (headData.length === 0) {
    return (
      <StatusText data-testid="statustext-0wes">
        <TranslatedText
          stringId="appointments.outpatientCalendar.noAppointments"
          fallback="No appointments to display. Please try adjusting the search filters."
          data-testid="translatedtext-irve"
        />
      </StatusText>
    );
  }

  const canCreateAppointment = ability.can('create', 'Appointment');

  return (
    <Box
      className={APPOINTMENT_CALENDAR_CLASS}
      display="flex"
      width="100%"
      overflow="auto"
      flex={1}
      data-testid="box-8llp"
    >
      {headData?.map((cell, cellIndex) => {
        const appointments = cellData[cell.id];
        const title =
          groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP ? (
            <TranslatedReferenceData
              category="locationGroup"
              value={cell.id}
              fallback={cell.name}
              data-testid={`translatedreferencedata-5vst-${cell.code}`}
            />
          ) : (
            cell.displayName
          );
        return (
          <ColumnWrapper className="column-wrapper" key={cell.id} data-testid="columnwrapper-u5rp">
            <HeadCell title={title} count={appointments?.length || 0} data-testid="headcell-9w0q" />
            <AppointmentColumnWrapper data-testid="appointmentcolumnwrapper-yxim">
              {appointments.map((a, appointmentIndex) => (
                <AppointmentTile
                  key={a.id}
                  appointment={a}
                  onEdit={() => onModify(a)}
                  onCancel={() => onCancel(a)}
                  actions={
                    canCreateAppointment
                      ? [
                          {
                            label: (
                              <TranslatedText
                                stringId="appointments.action.newAppointment"
                                fallback="New appointment"
                                data-testid={`translatedtext-fn6p-${cellIndex}-${appointmentIndex}`}
                              />
                            ),
                            action: () => onCreateFromExisting(a),
                          },
                          {
                            label: (
                              <TranslatedText
                                stringId="appointments.action.emailAppointment"
                                fallback="Email appointment"
                                data-testid={`translatedtext-1xgj-${cellIndex}-${appointmentIndex}`}
                              />
                            ),
                            action: () =>
                              setEmailModalState({ appointmentId: a.id, email: a.patient?.email }),
                          },
                        ]
                      : []
                  }
                  testIdPrefix={`${cellIndex}-${appointmentIndex}`}
                />
              ))}
            </AppointmentColumnWrapper>
          </ColumnWrapper>
        );
      })}
      <FormModal
        title={
          <TranslatedText
            stringId="patient.email.title"
            fallback="Enter email address"
            data-testid="translatedtext-topi"
          />
        }
        open={!!emailModalState}
        onClose={() => setEmailModalState(null)}
        data-testid="formmodal-vx6o"
      >
        <EmailAddressConfirmationForm
          onSubmit={async ({ email }) => {
            await sendAppointmentEmail(email);
            setEmailModalState(null);
          }}
          onCancel={() => setEmailModalState(null)}
          emailOverride={emailModalState?.email}
          data-testid="emailaddressconfirmationform-yhdd"
        />
      </FormModal>
    </Box>
  );
};
