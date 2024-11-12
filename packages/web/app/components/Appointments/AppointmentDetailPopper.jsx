import Overnight from '@mui/icons-material/Brightness2';
import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import { push } from 'connected-react-router';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_VALUES } from '@tamanu/constants';

import { isSameDay } from 'date-fns';
import { useApi } from '../../api';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { Colors } from '../../constants';
import { reloadPatient } from '../../store';
import { formatDateTimeRange } from '../../utils/dateTime';
import { DateDisplay } from '../DateDisplay';
import { MenuButton } from '../MenuButton';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedSex, TranslatedText } from '../Translation';
import { AppointmentStatusChip } from './AppointmentStatusChip';

export const APPOINTMENT_DRAWER_CLASS = 'appointment-drawer';
const DEBOUNCE_DELAY = 200; // ms

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

const PrimaryDetails = styled('div')`
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
  .MuiPaper-root {
    box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
    width: 3.625rem;
  }

  .MuiPopper-root {
    width: 3.625rem;
  }

  svg {
    font-size: 0.875rem;
  }
  #menu-list-grow {
    box-shadow: 0px 0.25rem 1rem 0px hsla(0, 0%, 0%, 0.1);
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  svg {
    font-size: 0.875rem;
  }
`;

const ControlsRow = ({ onClose, onCancel, onEdit }) => {
  const actions = [
    {
      label: <TranslatedText stringId="general.action.modify" fallback="Modify" />,
      action: onEdit,
    },
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
      action: onCancel,
    },
  ];

  return (
    <ControlsContainer>
      <StyledMenuButton actions={actions} placement="bottom-start" />
      <StyledIconButton onClick={onClose}>
        <Close />
      </StyledIconButton>
    </ControlsContainer>
  );
};

const InlineDetailsDisplay = ({ label, value }) => (
  <span>
    <Label>{label}: </Label> {value ?? '—'}
  </span>
);

const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? <>&mdash;</>}</span>
  </FlexCol>
);

const BookingTypeDisplay = ({ bookingType, isOvernight }) => (
  <DetailsDisplay
    label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
    value={
      <FlexRow sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <TranslatedReferenceData
          value={bookingType.id}
          fallback={bookingType.name}
          category="bookingType"
        />
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
      <PrimaryDetails>
        <InlineDetailsDisplay
          label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          value={<TranslatedSex sex={sex} />}
        />
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
            />
          }
          value={<DateDisplay date={dateOfBirth} noTooltip />}
        />
      </PrimaryDetails>
      {additionalData?.primaryContactNumber && (
        <InlineDetailsDisplay
          label={
            <TranslatedText stringId="patient.details.reminderContacts.label" fallback="Contact" />
          }
          value={additionalData.primaryContactNumber}
        />
      )}
      <PatientId>{displayId}</PatientId>
    </PatientDetailsContainer>
  );
};

const AppointmentDetailsDisplay = ({ appointment }) => {
  const {
    startTime,
    endTime,
    clinician,
    locationGroup,
    location,
    bookingType,
    appointmentType,
  } = appointment;
  const isOvernight = !isSameDay(startTime, endTime);

  return (
    <AppointmentDetailsContainer>
      <DetailsDisplay
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateTimeRange(startTime, endTime)}
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
            fallback={location?.locationGroup?.name || locationGroup?.name}
            value={location?.locationGroup?.id || locationGroup?.id}
            category="locationGroup"
          />
        }
      />
      {location && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.name}
              value={location?.id}
              category="location"
            />
          }
        />
      )}
      {bookingType && <BookingTypeDisplay bookingType={bookingType} isOvernight={isOvernight} />}
      {appointmentType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="scheduling.appointmentType.label"
              fallback="Appointment type"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType.id}
              fallback={appointmentType.name}
              category="appointmentType"
            />
          }
        />
      )}
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
      {APPOINTMENT_STATUS_VALUES.filter(status => status !== APPOINTMENT_STATUSES.CANCELLED).map(
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
  onStatusChange,
  onEdit,
  onCancel,
  anchorEl,
  appointment,
}) => {
  const dispatch = useDispatch();
  const api = useApi();
  const [localStatus, setLocalStatus] = useState(appointment.status);
  const patientId = appointment.patient.id;

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
          onStatusChange?.(newValue);
        } catch (error) {
          toast.error(
            <TranslatedText
              stringId="schedule.error.updateStatus"
              fallback="Error updating appointment status"
            />,
          );
          setLocalStatus(appointment.status);
        }
      }, DEBOUNCE_DELAY),
    [api, appointment.id, appointment.status, onStatusChange],
  );

  const updateAppointmentStatus = useCallback(
    newValue => {
      setLocalStatus(newValue);
      debouncedUpdateAppointmentStatus(newValue);
    },
    [debouncedUpdateAppointmentStatus],
  );

  const handleClickAway = e => {
    if (e.target.closest(`.${APPOINTMENT_DRAWER_CLASS}`)) return;
    onClose();
  };

  const modifiers = [
    {
      name: 'offset',
      options: {
        offset: [0, 2],
      },
    },
    {
      name: 'preventOverflow',
      enabled: true,
      options: {
        altAxis: true,
        altBoundary: true,
        tether: false,
        rootBoundary: 'document',
        padding: { top: 64, left: 184 }, // px conversions of height / width from CarouselComponents
      },
    },
  ];

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      onClick={e => e.stopPropagation()} // Prevent the popper from closing when clicked
      sx={{
        zIndex: 10,
      }}
      modifiers={modifiers}
    >
      <ClickAwayListener
        onClickAway={handleClickAway}
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
      >
        <Box>
          <ControlsRow onClose={onClose} onEdit={onEdit} onCancel={onCancel} />
          <StyledPaper elevation={0}>
            <PatientDetailsDisplay
              patient={appointment.patient}
              onClick={handlePatientDetailsClick}
            />
            <AppointmentDetailsDisplay appointment={appointment} />
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
