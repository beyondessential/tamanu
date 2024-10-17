import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Box, IconButton, Paper, Popper, styled } from '@mui/material';
import { MoreVert, Close, Brightness2 as Overnight } from '@mui/icons-material';
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
import { DateDisplay, getDateDisplay } from '../DateDisplay';
import { reloadPatient } from '../../store';
import { useApi } from '../../api';
import {
  APPOINTMENT_STATUS_VALUES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_LABELS,
} from '@tamanu/constants';
import { AppointmentStatusChip } from './AppointmentStatusChip';
import { TextButton } from '../Button';
import { EncounterModal } from '../EncounterModal';
import { usePatientCurrentEncounter } from '../../api/queries';
import { ConditionalTooltip } from '../Tooltip';


const DEBOUNCE_DELAY = 200; // ms

const formatDateRange = (start, end, isOvernight) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, { showDate: isOvernight, showTime: true });

  return `${formattedStart} - ${formattedEnd}`;
};

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
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5px;
  font-size: 0.6875rem;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const ControlsContainer = styled(FlexRow)`
  position: fixed;
  top: 8px;
  right: 8px;
  gap: 0.125rem;
`;

const PatientDetailsContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block-start: 0.75rem;
  padding-block-end: 0.5rem;
  gap: 0.1875rem;
  :hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
`;

const AppointmentDetailsContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block: 0.75rem;
  gap: 0.5rem;
  border-top: 1px solid ${Colors.outline};
  border-bottom: 1px solid ${Colors.outline};
`;

const AppointmentStatusContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block-start: 0.5rem;
  padding-block-end: 0.75rem;
  gap: 0.5rem;
  align-items: center;
`;

const AppointmentStatusGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-row-gap: 0.5rem;
  grid-column-gap: 0.3125rem;
  justify-items: center;
`;

const ControlsRow = ({ onClose }) => (
  <ControlsContainer>
    <StyledIconButton>
      <MoreVert sx={{ fontSize: '0.875rem' }} />
    </StyledIconButton>
    <StyledIconButton onClick={onClose}>
      <Close sx={{ fontSize: '0.875rem' }} />
    </StyledIconButton>
  </ControlsContainer>
);

const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? '—'}</span>
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
            <Overnight sx={{ fontSize: 15, color: Colors.primary }} />
            <TranslatedText stringId="scheduling.bookingType.overnight" fallback="Overnight" />
          </FlexRow>
        )}
      </FlexRow>
    }
  />
);

const PatientDetailsDisplay = ({ patient, additionalData, onClick }) => {
  const { displayId, sex, dateOfBirth } = patient;

  return (
    <PatientDetailsContainer onClick={onClick}>
      <Title>
        <PatientNameDisplay patient={patient} />
      </Title>
      <span>
        <Label>
          <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />:
        </Label>{' '}
        <TranslatedSex sex={sex} />
        <Label>
          {' | '}
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
          />
          :
        </Label>{' '}
        <DateDisplay date={dateOfBirth} />
      </span>
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
      <Label color={Colors.primary}>{displayId}</Label>
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

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  .MuiTooltip-tooltip {
    padding-inline: 1rem;
    max-width: 7.5rem;
  }
`;

const CheckInButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 0.6875rem;
  text-decoration: underline;
  text-transform: none;
`;

const AppointmentStatusDisplay = ({
  selectedStatus,
  updateAppointmentStatus,
  onOpenEncounterModal,
  createdEncounter,
}) => {
  return (
    <AppointmentStatusContainer>
      <AppointmentStatusGrid>
        {APPOINTMENT_STATUS_VALUES.filter(status => status != APPOINTMENT_STATUSES.CANCELLED).map(
          status => (
            <AppointmentStatusChip
              key={status}
              appointmentStatus={status}
              deselected={status !== selectedStatus}
              onClick={() => updateAppointmentStatus(status)}
            />
          ),
        )}
      </AppointmentStatusGrid>
      <StyledConditionalTooltip
        title={
          <TranslatedText
            stringId="scheduling.tooltip.alreadyAdmitted"
            fallback="Patient already admitted"
          />
        }
        visible={!!createdEncounter}
      >
        <CheckInButton onClick={() => onOpenEncounterModal()} disabled={!!createdEncounter}>
          <TranslatedText
            stringId="scheduling.action.admitOrCheckIn"
            fallback="Admit or check-in"
          />
        </CheckInButton>
      </StyledConditionalTooltip>
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
}) => {
  const dispatch = useDispatch();
  const api = useApi();
  const [localStatus, setLocalStatus] = useState(appointment.status);
  const patientId = appointment.patient.id;

  const { data: initialEncounter } = usePatientCurrentEncounter(patientId);

  const [localStatus, setLocalStatus] = useState(appointment.status);
  const [encounterModal, setEncounterModal] = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [additionalData, setAdditionalData] = useState();

  useEffect(() => {
    setCurrentEncounter(initialEncounter);
  }, [initialEncounter]);

  useEffect(() => {
    (async () => {
      const data = await api.get(`/patient/${patientId}/additionalData`);
      setAdditionalData(data);
    })();
  }, [patientId, api]);

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/all/${patientId}`));
  }, [dispatch, patientId]);

  const onOpenEncounterModal = useCallback(() => setEncounterModal(true), []);
  const onCloseEncounterModal = useCallback(() => setEncounterModal(false), []);
  const setEncounter = useCallback(
    async encounter => {
      setCurrentEncounter(encounter);
      onCloseEncounterModal();
    },
    [onCloseEncounterModal],
  );

  const debouncedUpdateAppointmentSatus = useMemo(
    () =>
      debounce(async newValue => {
        try {
          await api.put(`appointments/${appointment.id}`, {
            status: newValue,
          });
          if (onUpdated) onUpdated();
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
    [api, appointment.id, onUpdated, appointment.status],
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
      <ControlsRow onClose={onClose} />
      <StyledPaper elevation={0}>
        <PatientDetailsDisplay
          patient={appointment.patient}
          additionalData={additionalData}
          onClick={handlePatientDetailsClick}
        />
        <AppointDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
        <AppointmentStatusDisplay
          selectedStatus={localStatus}
          updateAppointmentStatus={updateAppointmentStatus}
          createdEncounter={currentEncounter}
          onOpenEncounterModal={onOpenEncounterModal}
        />
      </StyledPaper>
      <EncounterModal
        initialValues={{
          locationId: appointment?.location?.id,
          examinerId: appointment?.clinician?.id,
          practitionerId: appointment?.clinician?.id,
        }}
        open={encounterModal}
        onClose={onCloseEncounterModal}
        onSubmitEncounter={setEncounter}
        noRedirectOnSubmit
        patient={appointment.patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
    </Popper>
  );
};
