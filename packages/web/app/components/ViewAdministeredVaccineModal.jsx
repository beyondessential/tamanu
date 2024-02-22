import React from 'react';
import styled from 'styled-components';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { VACCINE_STATUS, VACCINE_STATUS_LABELS } from '@tamanu/constants';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';
import { useApi } from '../api';
import { DateDisplay } from './DateDisplay';
import { Modal } from './Modal';
import { TranslatedText, TranslatedEnum } from './Translation';
import { LowerCase } from './Typography';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${Colors.white};
  ${props => (props.$editMode ? 'margin-bottom: 20px;' : '')}
  position: relative;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

const DisplayField = styled.div`
  width: 50%;
  padding-right: 15px;
  padding-bottom: 20px;
  color: ${Colors.darkestText};
  font-weight: 500;
  &:nth-child(2n) {
    ${props => (props.$editMode ? `border-left: 1px solid ${Colors.outline};` : '')}
    ${props => (props.$editMode ? `padding-left: 15px;` : '')}
  }
`;

const Label = styled.div`
  font-weight: 400;
  color: ${Colors.midText};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 90%;
  border-bottom: 1px solid ${Colors.outline};
  &:last-of-type {
    border-bottom: none;
    padding-bottom: 20px;
  }
  padding-top: 20px;
`;

/* eslint-disable react/jsx-key */
const FieldsViewer = ({ labelValueFieldGroups, editMode }) => (
  <Container $editMode={editMode}>
    {labelValueFieldGroups.map(({ key, fields }) => (
      <FieldGroup key={key}>
        {fields.map(({ label, value }) => (
          <DisplayField key={label} $editMode={editMode}>
            <Label>{label}</Label>
            {value}
          </DisplayField>
        ))}
      </FieldGroup>
    ))}
  </Container>
);
/* eslint-enable react/jsx-key */

const ErrorMessage = () => {
  return (
    <Box p={5}>
      <Alert severity="error">
        <AlertTitle>
          <TranslatedText
            stringId="vaccine.error.cantLoadVaccine.title"
            fallback="Error: Cannot load view modal for this vaccine"
          />
        </AlertTitle>
        <TranslatedText
          stringId="vaccine.error.cantLoadVaccine.subTitle"
          fallback="Please contact Tamanu administrator"
        />
      </Alert>
    </Box>
  );
};

export const ViewAdministeredVaccineContent = ({ vaccineRecord, editMode }) => {
  const {
    id: vaccineRecordId,
    status,
    injectionSite,
    scheduledVaccine: { label: vaccineLabel, schedule },
    encounter: { patientId },
    recorder,
    givenBy,
    location,
    department,
    date,
    batch,
    vaccineName,
    vaccineBrand,
    disease,
    givenElsewhere,
    notGivenReason,
    encounter,
    circumstanceIds,
  } = vaccineRecord;

  const routine = !vaccineName;
  const notGiven = VACCINE_STATUS.NOT_GIVEN === status;

  const api = useApi();
  const { data: { data: vaccineCircumstances } = {} } = useQuery({
    queryKey: ['administeredVaccine', patientId, vaccineRecordId],
    queryFn: () =>
      api.get(`patient/${patientId}/administeredVaccine/${vaccineRecordId}/circumstances`),
    // to avoid unnecessary API calls, these are the conditions that will show circumstance
    enabled: Boolean(!editMode && givenElsewhere && circumstanceIds),
  });

  if (!vaccineRecord) return null;

  const fieldObjects = {
    vaccine: {
      label: <TranslatedText stringId="vaccine.vaccine.label" fallback="Vaccine" />,
      value: vaccineLabel || '-',
    },
    batch: {
      label: <TranslatedText stringId="vaccine.batch.label" fallback="Batch" />,
      value: batch || '-',
    },
    schedule: {
      label: <TranslatedText stringId="vaccine.schedule.label" fallback="Schedule" />,
      value: schedule || '-',
    },
    dateRecorded: {
      label: <TranslatedText stringId="vaccine.dateRecorded.label" fallback="Date recorded" />,
      value: <DateDisplay date={date} />,
    },
    dateGiven: {
      label: <TranslatedText stringId="vaccine.dateGiven.label" fallback="Date given" />,
      value: <DateDisplay date={date} />,
    },
    injectionSite: {
      label: <TranslatedText stringId="vaccine.injectionSite.label" fallback="Injection site" />,
      value: injectionSite || '-',
    },
    area: {
      label: <TranslatedText stringId="general.area.label" fallback="Area" />,
      value: location?.locationGroup?.name || '-',
    },
    location: {
      label: <TranslatedText stringId="general.location.label" fallback="Location" />,
      value: location?.name || '-',
    },
    department: {
      label: <TranslatedText stringId="general.department.label" fallback="Department" />,
      value: department?.name || '-',
    },
    facility: {
      label: <TranslatedText stringId="general.facility.label" fallback="Facility" />,
      value: location?.facility.name || encounter.location.facility.name || '-',
    },
    givenBy: {
      label: <TranslatedText stringId="vaccine.givenBy.label" fallback="Given by" />,
      value: givenBy || '-',
    },
    supervisingClinician: {
      label: (
        <TranslatedText
          stringId="general.supervisingClinician.label"
          fallback="Supervising :clinician"
          replacements={{
            clinician: (
              <LowerCase>
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                />
              </LowerCase>
            ),
          }}
        />
      ),
      value: givenBy || '-',
    },
    recordedBy: {
      label: <TranslatedText stringId="vaccine.recordedBy.label" fallback="Recorded by" />,
      value: recorder?.displayName || '-',
    },
    vaccineName: {
      label: <TranslatedText stringId="vaccine.vaccineName.label" fallback="Vaccine name" />,
      value: vaccineName || '-',
    },
    vaccineBrand: {
      label: <TranslatedText stringId="vaccine.vaccineBrand.label" fallback="Vaccine brand" />,
      value: vaccineBrand || '-',
    },
    disease: {
      label: <TranslatedText stringId="vaccine.disease.label" fallback="Disease" />,
      value: disease || '-',
    },
    status: {
      label: <TranslatedText stringId="vaccine.status.label" fallback="Status" />,
      value: givenElsewhere ? (
        'Given elsewhere'
      ) : (
        <TranslatedEnum
          prefix="vaccine.property.status"
          value={status}
          enumValues={VACCINE_STATUS_LABELS}
          enumFallback="-"
        />
      ),
    },
    country: {
      label: <TranslatedText stringId="vaccine.country.label" fallback="Country" />,
      value: givenBy || '-',
    },
    reason: {
      label: <TranslatedText stringId="vaccine.reason.label" fallback="Reason" />,
      value: notGivenReason?.name || '-',
    },
    circumstance: {
      label: <TranslatedText stringId="vaccine.circumstance.label" fallback="Circumstance" />,
      value:
        vaccineCircumstances?.length > 0
          ? vaccineCircumstances?.map(circumstance => circumstance?.name)?.join(', ')
          : '-',
    },
  };

  const modalVersions = [
    {
      name: 'routine',
      condition: routine && !notGiven && !givenElsewhere,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.schedule },
            { field: fieldObjects.status },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.givenBy, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'routineOverseas',
      condition: routine && !notGiven && givenElsewhere,
      fieldGroups: [
        {
          key: 'status',
          fields: [
            { field: fieldObjects.circumstance, editMode: false },
            { field: fieldObjects.status, editMode: false },
          ],
        },
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },

            { field: fieldObjects.schedule, editMode: true },
            { field: fieldObjects.status, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },

            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        { key: 'country', fields: [{ field: fieldObjects.country, editMode: false }] },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.facility, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'other',
      condition: !routine && !notGiven && !givenElsewhere,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.vaccineBrand, editMode: false },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.givenBy, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'otherOverseas',
      condition: !routine && !notGiven && givenElsewhere,
      fieldGroups: [
        {
          key: 'status',
          fields: [
            { field: fieldObjects.circumstance, editMode: false },
            { field: fieldObjects.status, editMode: false },
          ],
        },
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.status, editMode: true },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.vaccineBrand, editMode: false },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        { key: 'country', fields: [{ field: fieldObjects.country, editMode: false }] },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.facility, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'notGiven',
      condition: notGiven && routine,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },
            { field: fieldObjects.schedule },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.reason, editMode: false },
            { field: fieldObjects.dateRecorded, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.supervisingClinician, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'notGivenOther',
      condition: notGiven && !routine,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.reason, editMode: false },
            { field: fieldObjects.dateRecorded, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.supervisingClinician, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
  ];

  const modalVersion = modalVersions.find(modalType => modalType.condition === true);
  if (!modalVersion) return <ErrorMessage />;
  const fieldGroups = modalVersion.fieldGroups
    .map(group => ({
      ...group,
      fields: group.fields
        .filter(field => {
          // filter out fields if they're conditional on the editMode, and the editMode doesn't match
          // this can be written more concisely but i want it explicit
          if (editMode && field.editMode === true) return true;
          if (!editMode && field.editMode === false) return true;
          if (!Object.prototype.hasOwnProperty.call(field, 'editMode')) return true;
          return false;
        })
        .map(({ field }) => field),
    }))
    .filter(group => {
      // eliminate empty groups
      return group.fields.length > 0;
    });

  return <FieldsViewer labelValueFieldGroups={fieldGroups} editMode={editMode} />;
};

export const ViewAdministeredVaccineModal = ({ open, onClose, vaccineRecord }) => {
  if (!vaccineRecord) return null;
  return (
    <Modal
      title={<TranslatedText stringId="vaccine.modal.view.title" fallback="View vaccine record" />}
      open={open}
      onClose={onClose}
      cornerExitButton={false}
    >
      <ViewAdministeredVaccineContent vaccineRecord={vaccineRecord} />
      <ModalActionRow
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        onConfirm={onClose}
      />
    </Modal>
  );
};
