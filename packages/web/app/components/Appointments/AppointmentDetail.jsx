import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Select from 'react-select';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import {
  Button,
  DeleteButton,
  Modal,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedSex,
  DateDisplay,
  DateTimeRangeDisplay,
} from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TextDisplayIdLabel } from '../DisplayIdLabel';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import { AppointmentModal } from './AppointmentModal';
import { EncounterModal } from '../EncounterModal';
import { usePatientAdditionalDataQuery, usePatientCurrentEncounterQuery } from '../../api/queries';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id, displayId, sex, dateOfBirth, village } = patient;
  const { data: additionalData } = usePatientAdditionalDataQuery(patient.id);

  const handlePatientInfoContainerClick = useCallback(async () => {
    await dispatch(reloadPatient(id));
    navigate(`/patients/all/${id}`);
  }, [dispatch, id, navigate]);

  return (
    <PatientInfoContainer
      onClick={handlePatientInfoContainerClick}
      data-testid="patientinfocontainer-e64l"
    >
      <PatientNameRow data-testid="patientnamerow-esu5">
        <PatientName data-testid="patientname-4kb0">
          <PatientNameDisplay patient={patient} data-testid="patientnamedisplay-pai4" />
        </PatientName>
        <TextDisplayIdLabel data-testid="textdisplayidlabel-tt15">{displayId}</TextDisplayIdLabel>
      </PatientNameRow>
      <table>
        <tbody>
          <tr>
            <PatientInfoLabel data-testid="patientinfolabel-tjca">
              <TranslatedText
                stringId="general.sex.label"
                fallback="Sex"
                data-testid="translatedtext-zmey"
              />
            </PatientInfoLabel>
            <PatientInfoValue data-testid="patientinfovalue-y2mw">
              <TranslatedSex sex={sex} data-testid="translatedsex-gu10" />
            </PatientInfoValue>
          </tr>
          <tr>
            <PatientInfoLabel data-testid="patientinfolabel-oa60">
              <TranslatedText
                stringId="general.dateOfBirth.label"
                fallback="Date of Birth"
                data-testid="translatedtext-ery9"
              />
            </PatientInfoLabel>
            <PatientInfoValue data-testid="patientinfovalue-5sc3">
              <DateDisplay date={dateOfBirth} data-testid="datedisplay-j9tl" />
            </PatientInfoValue>
          </tr>
          {additionalData && additionalData.primaryContactNumber && (
            <tr>
              <PatientInfoLabel data-testid="patientinfolabel-ali9">
                <TranslatedText
                  stringId="general.contactNumber.label"
                  fallback="Contact Number"
                  data-testid="translatedtext-tvfa"
                />
              </PatientInfoLabel>
              <PatientInfoValue data-testid="patientinfovalue-mmk8">
                {additionalData.primaryContactNumber}
              </PatientInfoValue>
            </tr>
          )}
          {village && (
            <tr>
              <PatientInfoLabel data-testid="patientinfolabel-f18g">
                <TranslatedText
                  stringId="general.village.label"
                  fallback="Village"
                  data-testid="translatedtext-nlcf"
                />
              </PatientInfoLabel>
              <PatientInfoValue data-testid="patientinfovalue-sldm">
                <TranslatedReferenceData
                  fallback={village.name}
                  value={village.id}
                  category="village"
                  data-testid="translatedreferencedata-rdkq"
                />
              </PatientInfoValue>
            </tr>
          )}
        </tbody>
      </table>
    </PatientInfoContainer>
  );
};

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
          data-testid="translatedtext-99vs"
        />
      }
      onClose={onClose}
      open={open}
      data-testid="modal-219a"
    >
      <Heading data-testid="heading-h04q">
        <TranslatedText
          stringId="scheduling.modal.cancelAppointment.heading"
          fallback="Are you sure you want to cancel this appointment?"
          data-testid="translatedtext-4zav"
        />
      </Heading>
      <Details data-testid="details-mez6">
        {
          <TranslatedText
            stringId="scheduling.modal.cancelAppointment.detailsText"
            fallback=":appointmentType appointment for"
            replacements={{ appointmentType: appointmentType.name }}
            data-testid="translatedtext-ert6"
          />
        }{' '}
        <PatientNameDisplay patient={patient} data-testid="patientnamedisplay-bdl0" />
        {' - '}
        <DateTimeRangeDisplay
          start={appointment.startTime}
          end={appointment.endTime}
          weekdayFormat="short"
          dateFormat="dayMonth"
          data-testid="datetimerangedisplay-e45m"
        />
      </Details>
      <Row data-testid="row-b2f3">
        <DeleteButton onClick={onConfirm} data-testid="deletebutton-iisx">
          <TranslatedText
            stringId="scheduling.modal.cancelAppointment.action.cancel"
            fallback="Yes, Cancel"
            data-testid="translatedtext-7d6z"
          />
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

  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalDataQuery(
    patient.id,
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
    <Container data-testid="container-aoyh">
      <CloseButtonSection data-testid="closebuttonsection-7d77">
        <StyledIconButton onClick={onClose} data-testid="stylediconbutton-15p4">
          <CloseIcon data-testid="closeicon-snwj" />
        </StyledIconButton>
      </CloseButtonSection>
      {errorMessage && <Section data-testid="section-sm6p">{errorMessage}</Section>}
      <FirstRow data-testid="firstrow-ym16">
        <div>
          {appointmentType && (
            <>
              <Heading data-testid="heading-e5k4">
                <TranslatedText
                  stringId="general.type.label"
                  fallback="Type"
                  data-testid="translatedtext-bsai"
                />
              </Heading>
              <TranslatedReferenceData
                value={appointmentType.id}
                fallback={appointmentType.name}
                category="appointmentType"
                data-testid="translatedreferencedata-kwtk"
              />
            </>
          )}
          <Heading data-testid="heading-9cda">
            <TranslatedText
              stringId="general.time.label"
              fallback="Time"
              data-testid="translatedtext-nko3"
            />
          </Heading>
          <div>
            <DateTimeRangeDisplay
              start={appointment.startTime}
              end={appointment.endTime}
              weekdayFormat="short"
              dateFormat="dayMonth"
              data-testid="datetimerangedisplay-qco2"
            />
          </div>
        </div>
        <Select
          placeholder={
            <TranslatedText
              stringId="scheduling.appointmentDetail.select.status.label"
              fallback="Select Status"
              data-testid="translatedtext-mv15"
            />
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
          data-testid="select-mkhv"
        />
      </FirstRow>
      <Section data-testid="section-ytbc">
        <Heading data-testid="heading-hech">
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
            data-testid="translatedtext-bxc9"
          />
        </Heading>
        {clinician.displayName}
      </Section>
      <PatientInfo patient={patient} data-testid="patientinfo-rb4a" />
      <Section data-testid="section-a3ne">
        <Heading data-testid="heading-a94h">
          <TranslatedText
            stringId="general.area.label"
            fallback="Area"
            data-testid="translatedtext-xbbh"
          />
        </Heading>
        <TranslatedReferenceData
          fallback={locationGroup.name}
          value={locationGroup.id}
          category="locationGroup"
          data-testid="translatedreferencedata-f39c"
        />
      </Section>
      <Button
        variant="outlined"
        color="primary"
        onClick={onOpenAppointmentModal}
        data-testid="button-sspn"
      >
        <TranslatedText
          stringId="scheduling.appointmentDetail.action.reschedule"
          fallback="Reschedule"
          data-testid="translatedtext-by16"
        />
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
            data-testid="button-o4dn"
          >
            <u>
              <TranslatedText
                stringId="scheduling.action.admitOrCheckIn"
                fallback="Admit or check in"
                data-testid="translatedtext-111l"
              />
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
          data-testid="alert-hpet"
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
        data-testid="appointmentmodal-r8t8"
      />
      {!additionalDataLoading && (
        <EncounterModal
          open={encounterModal}
          onClose={onCloseEncounterModal}
          onSubmitEncounter={onSubmitEncounterModal}
          noRedirectOnSubmit
          patient={patient}
          patientBillingTypeId={additionalData?.patientBillingTypeId}
          data-testid="encountermodal-nkni"
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
                data-testid="translatedtext-ob26"
              />,
            );
          }
          setCancelConfirmed(false);
          setCancelModal(false);
        }}
        data-testid="cancelappointmentmodal-f2lb"
      />
    </Container>
  );
};
