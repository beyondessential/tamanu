import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import Overnight from '@mui/icons-material/Brightness2';
import Close from '@mui/icons-material/Close';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';

import { PatientNameDisplay } from '../PatientNameDisplay';
import {
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedSex,
  TranslatedText,
} from '../Translation';
import { Colors } from '../../constants';
import { DateDisplay } from '../DateDisplay';
import { reloadPatient } from '../../store';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { CancelBookingModal } from './CancelBookingModal';
import { formatDateRange } from './utils';
import { useApi } from '../../api';
import {
  APPOINTMENT_STATUS_VALUES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_LABELS,
} from '@tamanu/constants';
import { AppointmentStatusChip } from './AppointmentStatusChip';
import { MenuButton } from '../MenuButton';
import { useQueryClient } from '@tanstack/react-query';

const DEBOUNCE_DELAY = 200; // ms

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const Title = styled('span')`
  font-weight: 500;
  font-size: 0.875rem;
`;

const Label = styled('span')`
  font-weight: 500;
  color: ${props => props.color || 'inherit'};
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
  padding: 0.75rem;
  gap: 0.5rem;
  border-top: max(0.0625rem, 1px) solid ${Colors.outline};
  border-bottom: max(0.0625rem, 1px) solid ${Colors.outline};
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

const ControlsRow = ({ onClose, appointment, openBookingForm, handleAppointmentUpdate }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
  };

  const actions = [
    {
      label: <TranslatedText stringId="general.action.modify" fallback="Modify" />,
      action: () => openBookingForm({ ...appointment, date: appointment.startTime }),
    },
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
      action: () => setCancelModalOpen(true),
    },
  ];

  return (
    <ControlsContainer>
      <StyledMenuButton actions={actions} />
      <StyledIconButton onClick={onClose}>
        <Close />
      </StyledIconButton>
      <CancelBookingModal
        appointment={appointment}
        open={cancelModalOpen}
        onClose={handleCancelModalClose}
        handleAppointmentUpdate={handleAppointmentUpdate}
      />
    </ControlsContainer>
  );
};

const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? <>&mdash;</>}</span>
  </FlexCol>
);

const InlineDetailsDisplay = ({ label, value }) => (
  <FlexRow sx={{ display: 'inline-flex' }}>
    <span>
      <Label>{label}: </Label> {value ?? '—'}
    </span>
  </FlexRow>
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
  const { data: additionalData, isLoading } = usePatientAdditionalDataQuery(id);
  return (
    <PatientDetailsContainer onClick={onClick}>
      <Title>
        <PatientNameDisplay patient={patient} />
      </Title>
      <span>
        <InlineDetailsDisplay
          label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          value={<TranslatedSex sex={sex} />}
        />
        <Label>{' | '}</Label>
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
            />
          }
          value={<DateDisplay date={dateOfBirth} />}
        />
      </span>
      {!isLoading && additionalData?.primaryContactNumber && (
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="patient.details.reminderContacts.field.contact"
              fallback="Contact"
            />
          }
          value={additionalData.primaryContactNumber}
        />
      )}
      <Label color={Colors.primary}>{displayId}</Label>
    </PatientDetailsContainer>
  );
};

const AppointmentDetailsDisplay = ({ appointment, isOvernight }) => {
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
            fallback={locationGroup?.name ?? '—'}
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
            fallback={location?.name ?? '—'}
            value={location?.id}
            category="location"
          />
        }
      />
      <BookingTypeDisplay type={type} isOvernight={isOvernight} />
    </AppointmentDetailsContainer>
  );
};

export const AppointmentStatusSelector = ({
  disabled,
  selectedStatus,
  updateAppointmentStatus,
}) => {
  return (
    <AppointmentStatusContainer role="radiogroup">
      {APPOINTMENT_STATUS_VALUES.filter(status => status != APPOINTMENT_STATUSES.CANCELLED).map(
        status => {
          const isSelected = status === selectedStatus;
          return (
            <AppointmentStatusChip
              appointmentStatus={status}
              aria-checked={isSelected}
              disabled={disabled || isSelected}
              key={status}
              onClick={() => updateAppointmentStatus(status)}
              role="radio"
              selected={isSelected}
            />
          );
        },
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
  isOvernight = false,
  openBookingForm,
}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const api = useApi();
  const [localStatus, setLocalStatus] = useState(appointment.status);
  const patientId = appointment.patient.id;

  const handleAppointmentUpdate = useCallback(() => {
    queryClient.invalidateQueries('appointments');
    if (onUpdated) onUpdated();
  }, [queryClient, onUpdated]);

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/all/${patientId}`));
  }, [dispatch, patientId]);

  const debouncedUpdateAppointmentStatus = useMemo(
    () =>
      debounce(async newValue => {
        try {
          await api.put(`appointments/${appointment.id}`, {
            status: newValue,
          });
          handleAppointmentUpdate();
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
    [api, appointment.id, appointment.status, handleAppointmentUpdate],
  );

  const updateAppointmentStatus = useCallback(
    newValue => {
      setLocalStatus(newValue);
      debouncedUpdateAppointmentStatus(newValue);
    },
    [debouncedUpdateAppointmentStatus],
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
            handleAppointmentUpdate={handleAppointmentUpdate}
          />
          <StyledPaper elevation={0}>
            <PatientDetailsDisplay
              patient={appointment.patient}
              onClick={handlePatientDetailsClick}
            />
            <AppointmentDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
            <AppointmentStatusSelector
              selectedStatus={localStatus}
              updateAppointmentStatus={updateAppointmentStatus}
            />
          </StyledPaper>
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};
