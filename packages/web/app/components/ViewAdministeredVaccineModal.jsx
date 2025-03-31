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
import {
  getReferenceDataStringId,
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
} from './Translation';
import { useTranslation } from '../contexts/Translation.jsx';

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
            data-testid='translatedtext-i0w1' />
        </AlertTitle>
        <TranslatedText
          stringId="vaccine.error.cantLoadVaccine.subTitle"
          fallback="Please contact administrator"
          data-testid='translatedtext-xe3o' />
      </Alert>
    </Box>
  );
};

export const ViewAdministeredVaccineContent = ({ vaccineRecord, editMode }) => {
  const {
    id: vaccineRecordId,
    status,
    injectionSite,
    scheduledVaccine: { label: vaccineLabel, id: vaccineId, doseLabel },
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

  const { getTranslation } = useTranslation();

  if (!vaccineRecord) return null;

  const fieldObjects = {
    vaccine: {
      label: <TranslatedText
        stringId="vaccine.vaccine.label"
        fallback="Vaccine"
        data-testid='translatedtext-y07k' />,
      value: vaccineId ? (
        <TranslatedReferenceData
          category="scheduledVaccine"
          fallback={vaccineLabel}
          value={vaccineId}
          data-testid='translatedreferencedata-0mu1' />
      ) : (
        '-'
      ),
    },
    batch: {
      label: <TranslatedText
        stringId="vaccine.batch.label"
        fallback="Batch"
        data-testid='translatedtext-henu' />,
      value: batch || '-',
    },
    schedule: {
      label: <TranslatedText
        stringId="vaccine.schedule.label"
        fallback="Schedule"
        data-testid='translatedtext-d9u0' />,
      value: doseLabel || '-',
    },
    dateRecorded: {
      label: <TranslatedText
        stringId="vaccine.dateRecorded.label"
        fallback="Date recorded"
        data-testid='translatedtext-lqo9' />,
      value: <DateDisplay date={date} data-testid='datedisplay-d341' />,
    },
    dateGiven: {
      label: <TranslatedText
        stringId="vaccine.dateGiven.label"
        fallback="Date given"
        data-testid='translatedtext-wnaa' />,
      value: <DateDisplay date={date} data-testid='datedisplay-wlxi' />,
    },
    injectionSite: {
      label: <TranslatedText
        stringId="vaccine.injectionSite.label"
        fallback="Injection site"
        data-testid='translatedtext-k641' />,
      value: injectionSite || '-',
    },
    area: {
      label: <TranslatedText
        stringId="general.area.label"
        fallback="Area"
        data-testid='translatedtext-yrch' />,
      value: location?.locationGroup ? (
        <TranslatedReferenceData
          fallback={location.locationGroup.name}
          value={location.locationGroup.id}
          category="locationGroup"
          data-testid='translatedreferencedata-swud' />
      ) : (
        '-'
      ),
    },
    location: {
      label: <TranslatedText
        stringId="general.location.label"
        fallback="Location"
        data-testid='translatedtext-ow47' />,
      value: location ? (
        <TranslatedReferenceData
          fallback={location.name}
          value={location.id}
          category="location"
          data-testid='translatedreferencedata-m5nw' />
      ) : (
        '-'
      ),
    },
    department: {
      label: <TranslatedText
        stringId="general.department.label"
        fallback="Department"
        data-testid='translatedtext-qorp' />,
      value: department ? (
        <TranslatedReferenceData
          fallback={department.name}
          value={department.id}
          category="department"
          data-testid='translatedreferencedata-likk' />
      ) : (
        '-'
      ),
    },
    facility: {
      label: <TranslatedText
        stringId="general.facility.label"
        fallback="Facility"
        data-testid='translatedtext-fynh' />,
      value:
        (location?.facility.name && (
          <TranslatedReferenceData
            fallback={location.facility.name}
            value={location.facility.id}
            category="facility"
            data-testid='translatedreferencedata-ko9g' />
        )) ||
        (encounter.location.facility.name && (
          <TranslatedReferenceData
            fallback={encounter.location.facility.name}
            value={encounter.location.facility.id}
            category="facility"
            data-testid='translatedreferencedata-f0fq' />
        )) ||
        '-',
    },
    givenBy: {
      label: <TranslatedText
        stringId="vaccine.givenBy.label"
        fallback="Given by"
        data-testid='translatedtext-cnzx' />,
      value: givenBy || '-',
    },
    supervisingClinician: {
      label: (
        <TranslatedText
          stringId="general.supervisingClinician.label"
          fallback="Supervising :clinician"
          replacements={{
            clinician: (
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                casing="lower"
                data-testid='translatedtext-jaka' />
            ),
          }}
          data-testid='translatedtext-qmxr' />
      ),
      value: givenBy || '-',
    },
    recordedBy: {
      label: <TranslatedText
        stringId="vaccine.recordedBy.label"
        fallback="Recorded by"
        data-testid='translatedtext-5ka7' />,
      value: recorder?.displayName || '-',
    },
    vaccineName: {
      label: <TranslatedText
        stringId="vaccine.vaccineName.label"
        fallback="Vaccine name"
        data-testid='translatedtext-auww' />,
      value: vaccineName || '-',
    },
    vaccineBrand: {
      label: <TranslatedText
        stringId="vaccine.vaccineBrand.label"
        fallback="Vaccine brand"
        data-testid='translatedtext-z5wf' />,
      value: vaccineBrand || '-',
    },
    disease: {
      label: <TranslatedText
        stringId="vaccine.disease.label"
        fallback="Disease"
        data-testid='translatedtext-608p' />,
      value: disease || '-',
    },
    status: {
      label: <TranslatedText
        stringId="vaccine.status.label"
        fallback="Status"
        data-testid='translatedtext-y073' />,
      value: givenElsewhere ? (
        'Given elsewhere'
      ) : (
        <TranslatedEnum
          value={status}
          enumValues={VACCINE_STATUS_LABELS}
          enumFallback="-"
          data-testid='translatedenum-g2yx' />
      ),
    },
    country: {
      label: <TranslatedText
        stringId="vaccine.country.label"
        fallback="Country"
        data-testid='translatedtext-r5sx' />,
      value: givenBy || '-',
    },
    reason: {
      label: (
        <TranslatedText
          stringId="general.localisedField.notGivenReasonId.label.short"
          fallback="Reason"
          data-testid='translatedtext-noua' />
      ),
      value: notGivenReason ? (
        <TranslatedReferenceData
          fallback={notGivenReason.name}
          value={notGivenReason.id}
          category="vaccineNotGivenReason"
          data-testid='translatedreferencedata-cxdh' />
      ) : (
        '-'
      ),
    },
    circumstance: {
      label: <TranslatedText
        stringId="vaccine.circumstance.label"
        fallback="Circumstance"
        data-testid='translatedtext-fmlf' />,
      value:
        vaccineCircumstances?.length > 0
          ? vaccineCircumstances
              ?.map(
                circumstance =>
                  circumstance &&
                  getTranslation(
                    getReferenceDataStringId(circumstance.id, 'vaccineCircumstance'),
                    circumstance.name,
                  ),
              )
              ?.join(', ')
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
      title={<TranslatedText
        stringId="vaccine.modal.view.title"
        fallback="View vaccine record"
        data-testid='translatedtext-1gku' />}
      open={open}
      onClose={onClose}
    >
      <ViewAdministeredVaccineContent vaccineRecord={vaccineRecord} />
      <ModalActionRow
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-testid='translatedtext-0zq3' />}
        onConfirm={onClose}
      />
    </Modal>
  );
};
