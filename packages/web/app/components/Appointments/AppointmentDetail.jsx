import React, { useCallback, useEffect, useState } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { format } from 'date-fns';
import Select from 'react-select';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { useQuery } from '@tanstack/react-query';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TextDisplayIdLabel } from '../DisplayIdLabel';
import { DateDisplay } from '../DateDisplay';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import { AppointmentModal } from './AppointmentModal';
import { Button, DeleteButton } from '../Button';
import { EncounterModal } from '../EncounterModal';
import { usePatientCurrentEncounterQuery } from '../../api/queries';
import { Modal } from '../Modal';
import { TranslatedReferenceData, TranslatedSex, TranslatedText } from '../Translation';

const Heading = styled.div`
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
`;

const PatientInfoContainer = styled.div`
  border: 2px solid ${Colors.outline};
  padding: 1rem 0.75rem;

  &:hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
`;

const PatientNameRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const PatientName = styled.div`
  font-weight: 700;
  font-size: 1.3;
`;

const PatientInfoLabel = styled.td`
  padding-right: 1rem;
  color: ${Colors.midText};
`;

const PatientInfoValue = styled.td`
  text-transform: capitalize;
`;

const APPOINTMENT_STATUS_OPTIONS = Object.values(APPOINTMENT_STATUSES).map(status => ({
  value: status,
  label: status,
}));

const PatientInfo = ({ patient }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { id, displayId, sex, dateOfBirth, village } = patient;
  const [additionalData, setAdditionalData] = useState();
  useEffect(() => {
    (async () => {
      const data = await api.get(`/patient/${id}/additionalData`);
      setAdditionalData(data);
    })();
  }, [id, api]);

  const handlePatientInfoContainerClick = useCallback(async () => {
    await dispatch(reloadPatient(id));
    dispatch(push(`/patients/all/${id}`));
  }, [dispatch, id]);

  return (
    <PatientInfoContainer onClick={handlePatientInfoContainerClick}>
      <PatientNameRow>
        <PatientName>
          <PatientNameDisplay patient={patient} />
        </PatientName>
        <TextDisplayIdLabel>{displayId}</TextDisplayIdLabel>
      </PatientNameRow>
      <table data-testid='table-5uya'>
        <tbody>
          <tr data-testid='tr-2mwo'>
            <PatientInfoLabel>
              <TranslatedText
                stringId="general.sex.label"
                fallback="Sex"
                data-testid='translatedtext-bgqx' />
            </PatientInfoLabel>
            <PatientInfoValue>
              <TranslatedSex sex={sex} />
            </PatientInfoValue>
          </tr>
          <tr data-testid='tr-5a4z'>
            <PatientInfoLabel>
              <TranslatedText
                stringId="general.dateOfBirth.label"
                fallback="Date of Birth"
                data-testid='translatedtext-03qa' />
            </PatientInfoLabel>
            <PatientInfoValue>
              <DateDisplay date={dateOfBirth} data-testid='datedisplay-0ion' />
            </PatientInfoValue>
          </tr>
          {additionalData && additionalData.primaryContactNumber && (
            <tr data-testid='tr-5i1i'>
              <PatientInfoLabel>
                <TranslatedText
                  stringId="general.contactNumber.label"
                  fallback="Contact Number"
                  data-testid='translatedtext-cf2x' />
              </PatientInfoLabel>
              <PatientInfoValue>{additionalData.primaryContactNumber}</PatientInfoValue>
            </tr>
          )}
          {village && (
            <tr data-testid='tr-um6c'>
              <PatientInfoLabel>
                <TranslatedText
                  stringId="general.village.label"
                  fallback="Village"
                  data-testid='translatedtext-5fp4' />
              </PatientInfoLabel>
              <PatientInfoValue>
                <TranslatedReferenceData
                  fallback={village.name}
                  value={village.id}
                  category="village"
                  data-testid='translatedreferencedata-54dy' />
              </PatientInfoValue>
            </tr>
          )}
        </tbody>
      </table>
    </PatientInfoContainer>
  );
};

const AppointmentTime = ({ startTime, endTime }) => (
  <span>
    {format(new Date(startTime), 'ccc dd LLL')}
    {' - '}
    {format(new Date(startTime), 'h:mm aaa')}
    {endTime && ` - ${format(new Date(endTime), 'h:mm aaa')}`}
  </span>
);

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Details = styled.div`
  margin-bottom: 1rem;
`;

const CancelAppointmentModal = ({ open, onClose, onConfirm, appointment }) => {
  const { appointmentType, patient } = appointment;
  return (
    <Modal
      width="sm"
      title={
        <TranslatedText
          stringId="scheduling.modal.cancelAppointment.title"
          fallback="Cancel Appointment"
          data-testid='translatedtext-zeqy' />
      }
      onClose={onClose}
      open={open}
    >
      <Heading>
        <TranslatedText
          stringId="scheduling.modal.cancelAppointment.heading"
          fallback="Are you sure you want to cancel this appointment?"
          data-testid='translatedtext-ay7m' />
      </Heading>
      <Details>
        {
          <TranslatedText
            stringId="scheduling.modal.cancelAppointment.detailsText"
            fallback=":appointmentType appointment for"
            replacements={{ appointmentType: appointmentType.name }}
            data-testid='translatedtext-74nu' />
        }{' '}
        <PatientNameDisplay patient={patient} />
        {' - '}
        <AppointmentTime {...appointment} />
      </Details>
      <Row>
        <DeleteButton onClick={onConfirm} data-testid='deletebutton-acql'>
          <TranslatedText
            stringId="scheduling.modal.cancelAppointment.action.cancel"
            fallback="Yes, Cancel"
            data-testid='translatedtext-k7pp' />
        </DeleteButton>
      </Row>
    </Modal>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;
  padding: 0.2rem 0 1rem;
`;

const Section = styled.div`
  margin-bottom: 0.5rem;
`;

const FirstRow = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 8rem;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.outline};
  column-gap: 2rem;
`;

const CloseButtonSection = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0;
`;

export const AppointmentDetail = ({ appointment, onUpdated, onClose }) => {
  const api = useApi();
  const { id, appointmentType, status, clinician, patient, locationGroup } = appointment;
  const {
    data: currentEncounter,
    error: currentEncounterError,
    isLoading: currentEncounterLoading,
  } = usePatientCurrentEncounterQuery(patient.id);

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${patient.id}/additionalData`),
  );
  const [statusOption, setStatusOption] = useState(
    APPOINTMENT_STATUS_OPTIONS.find(option => option.value === status),
  );
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [encounterModal, setEncounterModal] = useState(false);
  const [createdEncounter, setCreatedEncounter] = useState();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  useEffect(() => {
    setStatusOption(APPOINTMENT_STATUS_OPTIONS.find(option => option.value === status));
  }, [status]);

  useEffect(() => {
    if (currentEncounterError) {
      setShowErrorAlert(true);
    }
  }, [currentEncounterError]);

  const updateAppointmentStatus = useCallback(
    async newValue => {
      await api.put(`appointments/${id}`, {
        status: newValue,
      });
      onUpdated();
    },
    [api, id, onUpdated],
  );

  const onOpenAppointmentModal = useCallback(() => setAppointmentModal(true), []);
  const onCloseAppointmentModal = useCallback(() => setAppointmentModal(false), []);
  const onOpenEncounterModal = useCallback(() => setEncounterModal(true), []);
  const onCloseEncounterModal = useCallback(() => setEncounterModal(false), []);
  const onSubmitEncounterModal = useCallback(
    async encounter => {
      setCreatedEncounter(encounter);
      onCloseEncounterModal();
    },
    [onCloseEncounterModal],
  );

  return (
    <Container>
      <CloseButtonSection>
        <StyledIconButton onClick={onClose}>
          <CloseIcon />
        </StyledIconButton>
      </CloseButtonSection>
      {errorMessage && <Section>{errorMessage}</Section>}
      <FirstRow>
        <div>
          {appointmentType && (
            <>
              <Heading>
                <TranslatedText
                  stringId="general.type.label"
                  fallback="Type"
                  data-testid='translatedtext-qywm' />
              </Heading>
              <TranslatedReferenceData
                value={appointmentType.id}
                fallback={appointmentType.name}
                category="appointmentType"
                data-testid='translatedreferencedata-zen5' />
            </>
          )}
          <Heading>
            <TranslatedText
              stringId="general.time.label"
              fallback="Time"
              data-testid='translatedtext-lxw2' />
          </Heading>
          <div>
            <AppointmentTime {...appointment} />
          </div>
        </div>
        <Select
          placeholder={
            <TranslatedText
              stringId="scheduling.appointmentDetail.select.status.label"
              fallback="Select Status"
              data-testid='translatedtext-ev63' />
          }
          options={APPOINTMENT_STATUS_OPTIONS}
          value={statusOption}
          name="status"
          onChange={async selectedOption => {
            if (selectedOption.value === APPOINTMENT_STATUSES.CANCELLED && !cancelConfirmed) {
              setCancelModal(true);
              return;
            }
            setStatusOption(selectedOption);
            await updateAppointmentStatus(selectedOption.value);
          }}
          styles={{
            placeholder: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            valueContainer: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            dropdownIndicator: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            singleValue: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            control: baseStyles => ({
              ...baseStyles,
              backgroundColor: Colors.primary,
              color: Colors.white,
              borderColor: 'transparent',
            }),
            menu: baseStyles => ({
              ...baseStyles,
              backgroundColor: Colors.primary,
              color: Colors.white,
            }),
            option: (baseStyles, state) => ({
              ...baseStyles,
              backgroundColor: (state.isSelected || state.isFocused) && Colors.veryLightBlue,
              color: (state.isSelected || state.isFocused) && Colors.darkText,
            }),
          }}
        />
      </FirstRow>
      <Section>
        <Heading>
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
            data-testid='translatedtext-af60' />
        </Heading>
        {clinician.displayName}
      </Section>
      <PatientInfo patient={patient} />
      <Section>
        <Heading>
          <TranslatedText
            stringId="general.area.label"
            fallback="Area"
            data-testid='translatedtext-nioy' />
        </Heading>
        <TranslatedReferenceData
          fallback={locationGroup.name}
          value={locationGroup.id}
          category="locationGroup"
          data-testid='translatedreferencedata-7gdf' />
      </Section>
      <Button
        variant="outlined"
        color="primary"
        onClick={onOpenAppointmentModal}
        data-testid='button-kq8l'>
        <TranslatedText
          stringId="scheduling.appointmentDetail.action.reschedule"
          fallback="Reschedule"
          data-testid='translatedtext-tx97' />
      </Button>
      {!currentEncounter &&
        !currentEncounterError &&
        !currentEncounterLoading &&
        !additionalDataLoading &&
        !createdEncounter && (
          <Button
            variant="text"
            color="primary"
            onClick={onOpenEncounterModal}
            data-testid='button-pf81'>
            <u>
              <TranslatedText
                stringId="scheduling.action.admitOrCheckIn"
                fallback="Admit or check-in"
                data-testid='translatedtext-worp' />
            </u>
          </Button>
        )}
      {showErrorAlert && (
        <Alert
          severity="error"
          style={{ marginBottom: 20 }}
          onClose={() => {
            setShowErrorAlert(false);
          }}
        >
          Error: There was an error loading the current encounter
        </Alert>
      )}
      <AppointmentModal
        open={appointmentModal}
        onClose={onCloseAppointmentModal}
        appointment={appointment}
        onSuccess={() => {
          onUpdated();
        }}
      />
      {!additionalDataLoading && (
        <EncounterModal
          open={encounterModal}
          onClose={onCloseEncounterModal}
          onSubmitEncounter={onSubmitEncounterModal}
          noRedirectOnSubmit
          patient={patient}
          patientBillingTypeId={additionalData?.patientBillingTypeId}
        />
      )}
      <CancelAppointmentModal
        appointment={appointment}
        open={cancelModal}
        onClose={() => {
          setCancelModal(false);
        }}
        onConfirm={async () => {
          setCancelConfirmed(true);
          try {
            await updateAppointmentStatus(APPOINTMENT_STATUSES.CANCELLED);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            setErrorMessage(
              <TranslatedText
                stringId="scheduling.modal.cancelAppointment.error.unableToCancel"
                fallback="Unable to cancel appointment. Please try again."
                data-testid='translatedtext-sxxq' />,
            );
          }
          setCancelConfirmed(false);
          setCancelModal(false);
        }}
      />
    </Container>
  );
};
