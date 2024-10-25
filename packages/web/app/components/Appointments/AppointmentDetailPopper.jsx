import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Box, ClickAwayListener, IconButton, Paper, Popper, styled } from '@mui/material';
import { Brightness2 as Overnight, Close } from '@mui/icons-material';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';

import { getPatientNameAsString } from '../PatientNameDisplay';
import {
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedSex,
  TranslatedText,
} from '../Translation';
import { Colors } from '../../constants';
import { DateDisplay, getDateDisplay } from '../DateDisplay';
import { reloadPatient } from '../../store';
import { useApi } from '../../api';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import {
  APPOINTMENT_STATUS_VALUES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_LABELS,
} from '@tamanu/constants';
import { AppointmentStatusChip } from './AppointmentStatusChip';
import { MenuButton } from '../MenuButton';
import { useQueryClient } from '@tanstack/react-query';

const DEBOUNCE_DELAY = 200; // ms

const formatDateRange = (start, end, isOvernight) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, { showDate: isOvernight, showTime: true });

  return (
    <>
      {formattedStart}&nbsp;&ndash; {formattedEnd}
    </>
  );
};

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const PatientName = styled('h2')`
  font-size: 0.875rem;
  font-weight: 500;
  margin-block: 0;
`;

const Label = styled('span')`
  font-weight: 500;
`;

const StyledPaper = styled(Paper)`
  color: ${Colors.darkestText};
  display: flex;
  flex-direction: column;
  width: 16rem;
  box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
  border-radius: 0.3125rem;
  font-size: 0.6875rem;
`;

const ControlsContainer = styled(FlexRow)`
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  gap: 0.125rem;
`;

const PatientDetailsContainer = styled(FlexCol)`
  padding-block: 0.75rem 0.5rem;
  padding-inline: 0.75rem;
  gap: 0.1875rem;
  :hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
  border-top-left-radius: 0.3125rem;
  border-top-right-radius: 0.3125rem;
`;

const AppointmentDetailsContainer = styled(FlexCol)`
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
  gap: 0.5rem;
  padding: 0.75rem;
`;

const SexAndDob = styled('div')`
  > span + span {
    margin-inline-start: 0.25rem;
    padding-inline-start: 0.25rem;
    border-inline-start: max(0.0625rem, 1px) solid currentcolor;
  }
`;

const PatientId = styled('p')`
  color: ${Colors.primary};
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-block: 0;
`;

const AppointmentStatusContainer = styled(Box)`
  padding-inline: 0.75rem;
  padding-block: 0.5rem 0.75rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-row-gap: 0.5rem;
  grid-column-gap: 0.3125rem;
  justify-items: center;
`;

const StyledMenuButton = styled(MenuButton)`
  svg {
    font-size: 0.875rem;
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  svg {
    font-size: 0.875rem;
  }
`;

const ControlsRow = ({ onClose, appointment, openBookingForm }) => {
  const actions = [
    {
      label: <TranslatedText stringId="general.action.modify" fallback="Modify" />,
      action: () => openBookingForm({ ...appointment, date: appointment.startTime }, true),
    },
    // TODO: cancel workflow
    {
      label: <TranslatedText stringId="general.action.Cancel" fallback="Cancel" />,
      action: () => {},
    },
  ];

  return (
    <ControlsContainer>
      <StyledMenuButton actions={actions} />
      <StyledIconButton onClick={onClose}>
        <Close />
      </StyledIconButton>
    </ControlsContainer>
  );
};

const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? <>&mdash;</>}</span>
  </FlexCol>
);

const BookingTypeDisplay = ({ type, isOvernight }) => (
  <DetailsDisplay
    label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
    value={
      <FlexRow sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <TranslatedEnum value={type} enumValues={APPOINTMENT_TYPE_LABELS} enumFallback={type} />
        {isOvernight && (
          <FlexRow sx={{ gap: '2px' }}>
            <Overnight htmlColor={Colors.primary} sx={{ fontSize: 15 }} />
            <TranslatedText stringId="scheduling.bookingType.overnight" fallback="Overnight" />
          </FlexRow>
        )}
      </FlexRow>
    }
  />
);

const PatientDetailsDisplay = ({ patient, onClick }) => {
  const { id, displayId, sex, dateOfBirth } = patient;
  const { data: additionalData } = usePatientAdditionalDataQuery(id);

  return (
    <PatientDetailsContainer onClick={onClick}>
      <PatientName>{getPatientNameAsString(patient)}</PatientName>
      <SexAndDob>
        <span>
          <Label>
            <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />:
          </Label>{' '}
          <TranslatedSex sex={sex} />
        </span>
        <span>
          <Label>
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
            />
            :
          </Label>{' '}
          <DateDisplay date={dateOfBirth} />
        </span>
      </SexAndDob>
      {additionalData?.primaryContactNumber && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="patient.details.reminderContacts.field.contact"
              fallback="Contact"
              value={additionalData.primaryContactNumber}
            />
          }
        />
      )}
      <PatientId color={Colors.primary}>{displayId}</PatientId>
    </PatientDetailsContainer>
  );
};

const AppointDetailsDisplay = ({ appointment, isOvernight }) => {
  const { startTime, endTime, clinician, locationGroup, location, type } = appointment;
  return (
    <AppointmentDetailsContainer>
      <DetailsDisplay
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime, isOvernight)}
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
          />
        }
        value={clinician?.displayName}
      />
      <DetailsDisplay
        label={
          <TranslatedText stringId="general.localisedField.locationGroupId.label" fallback="Area" />
        }
        value={
          <TranslatedReferenceData
            fallback={locationGroup?.name}
            value={locationGroup?.id}
            category="locationGroup"
          />
        }
      />
      <DetailsDisplay
        label={
          <TranslatedText stringId="general.localisedField.locationId.label" fallback="Location" />
        }
        value={
          <TranslatedReferenceData
            fallback={location?.name}
            value={location?.id}
            category="location"
          />
        }
      />
      <BookingTypeDisplay type={type} isOvernight={isOvernight} />
    </AppointmentDetailsContainer>
  );
};

const AppointmentStatusDisplay = ({ selectedStatus, updateAppointmentStatus }) => {
  return (
    <AppointmentStatusContainer role="radiogroup">
      {APPOINTMENT_STATUS_VALUES.filter(status => status != APPOINTMENT_STATUSES.CANCELLED).map(
        status => (
          <AppointmentStatusChip
            appointmentStatus={status}
            aria-checked={status === selectedStatus}
            deselected={status !== selectedStatus}
            key={status}
            onClick={() => updateAppointmentStatus(status)}
            role="radio"
          />
        ),
      )}
    </AppointmentStatusContainer>
  );
};

export const AppointmentDetailPopper = ({
  open,
  onClose,
  onUpdated,
  anchorEl,
  appointment,
  isOvernight,
  openBookingForm,
}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const api = useApi();
  const [localStatus, setLocalStatus] = useState(appointment.status);
  const patientId = appointment.patient.id;

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/all/${patientId}`));
  }, [dispatch, patientId]);

  const debouncedUpdateAppointmentSatus = useMemo(
    () =>
      debounce(async newValue => {
        try {
          await api.put(`appointments/${appointment.id}`, {
            status: newValue,
          });
          if (onUpdated) onUpdated();
          queryClient.invalidateQueries('appointments');
        } catch (error) {
          console.log(error);
          toast.error(
            <TranslatedText
              stringId="schedule.error.updateStatus"
              fallback="Error updating appointment status"
            />,
          );
          setLocalStatus(appointment.status);
        }
      }, DEBOUNCE_DELAY),
    [api, appointment.id, onUpdated, appointment.status, queryClient],
  );

  const updateAppointmentStatus = useCallback(
    newValue => {
      setLocalStatus(newValue);
      debouncedUpdateAppointmentSatus(newValue);
    },
    [debouncedUpdateAppointmentSatus],
  );

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      onClick={e => e.stopPropagation()} // Prevent the popper from closing when clicked
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 2],
          },
        },
      ]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Box>
          <ControlsRow
            appointment={appointment}
            openBookingForm={openBookingForm}
            onClose={onClose}
          />
          <StyledPaper elevation={0}>
            <PatientDetailsDisplay
              patient={appointment.patient}
              onClick={handlePatientDetailsClick}
            />
            <AppointDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
            <AppointmentStatusDisplay
              selectedStatus={localStatus}
              updateAppointmentStatus={updateAppointmentStatus}
            />
          </StyledPaper>
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};
