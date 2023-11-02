import React from 'react';
import styled from 'styled-components';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { VACCINE_STATUS, VACCINE_STATUS_LABELS } from '@tamanu/constants';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';
import { useApi } from '../api';
import { TranslatedText } from './Translation/TranslatedText';

import { DateDisplay } from './DateDisplay';

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

const FieldsViewer = ({ labelValueFieldGroups, editMode }) => (
  <Container $editMode={editMode}>
    {labelValueFieldGroups.map(fieldGroup => (
      <FieldGroup>
        {fieldGroup.map(({ label, value }) => (
          <DisplayField $editMode={editMode}>
            <Label>{label}</Label>
            {value}
          </DisplayField>
        ))}
      </FieldGroup>
    ))}
  </Container>
);

const ErrorMessage = () => {
  return (
    <Box p={5}>
      <Alert severity="error">
        <AlertTitle>Error: Cannot load view modal for this vaccine</AlertTitle>
        Please contact Tamanu administrator
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
      label: <TranslatedText stringId="vaccine.form.vaccine.label" fallback="Vaccine" />,
      value: vaccineLabel || '-',
    },
    batch: {
      label: <TranslatedText stringId="vaccine.form.batch.label" fallback="Batch" />,
      value: batch || '-',
    },
    schedule: {
      label: <TranslatedText stringId="vaccine.form.schedule.label" fallback="Schedule" />,
      value: schedule || '-',
    },
    dateRecorded: {
      label: <TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />,
      value: <DateDisplay date={date} />,
    },
    dateGiven: {
      label: <TranslatedText stringId="vaccine.form.dateGiven.label" fallback="Date given" />,
      value: <DateDisplay date={date} />,
    },
    injectionSite: {
      label: <TranslatedText stringId="vaccine.form.injectionSite.label" fallback="Injection site" />,
      value: injectionSite || '-',
    },
    area: {
      label: <TranslatedText stringId="vaccine.form.area.label" fallback="Area" />,
      value: location?.locationGroup?.name || '-',
    },
    location: {
      label: <TranslatedText stringId="vaccine.form.location.label" fallback="Location" />,
      value: location?.name || '-',
    },
    department: {
      label: <TranslatedText stringId="vaccine.form.department.label" fallback="Department" />,
      value: department?.name || '-',
    },
    facility: {
      label: <TranslatedText stringId="vaccine.form.facility.label" fallback="Facility" />,
      value: location?.facility.name || encounter.location.facility.name || '-',
    },
    givenBy: {
      label: <TranslatedText stringId="vaccine.form.givenBy.label" fallback="Given by" />,
      value: givenBy || '-',
    },
    supervisingClinician: {
      label: (
        <TranslatedText
          stringId="vaccine.form.supervisingClinician.label"
          fallback="Supervising clinician"
        />
      ),
      value: givenBy || '-',
    },
    recordedBy: {
      label: <TranslatedText stringId="vaccine.form.recordedBy.label" fallback="Recorded by" />,
      value: recorder?.displayName || '-',
    },
    vaccineName: {
      label: <TranslatedText stringId="vaccine.form.vaccineName.label" fallback="Vaccine name" />,
      value: vaccineName || '-',
    },
    vaccineBrand: {
      label: <TranslatedText stringId="vaccine.form.vaccineBrand.label" fallback="Vaccine brand" />,
      value: vaccineBrand || '-',
    },
    disease: {
      label: <TranslatedText stringId="vaccine.form.disease.label" fallback="Disease" />,
      value: disease || '-',
    },
    status: {
      label: <TranslatedText stringId="vaccine.form.status.label" fallback="Status" />,
      value: givenElsewhere ? 'Given elsewhere' : VACCINE_STATUS_LABELS[status] || '-',
    },
    country: {
      label: <TranslatedText stringId="vaccine.form.country.label" fallback="Country" />,
      value: givenBy || '-',
    },
    reason: {
      label: <TranslatedText stringId="vaccine.form.reason.label" fallback="Reason" />,
      value: notGivenReason?.name || '-',
    },
    circumstance: {
      label: <TranslatedText stringId="vaccine.form.circumstance.label" fallback="Cirumstance" />,
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
      fields: [
        [
          fieldObjects.vaccine,
          ...(editMode ? [] : [fieldObjects.batch]),
          fieldObjects.schedule,
          fieldObjects.status,
          ...(editMode
            ? [fieldObjects.recordedBy, fieldObjects.facility]
            : [fieldObjects.dateGiven, fieldObjects.injectionSite]),
        ],
        ...(editMode
          ? []
          : [
              [
                fieldObjects.area,
                fieldObjects.location,
                fieldObjects.department,
                fieldObjects.facility,
              ],
              [fieldObjects.givenBy, fieldObjects.recordedBy],
            ]),
      ],
    },
    {
      name: 'routineOverseas',
      condition: routine && !notGiven && givenElsewhere,
      fields: [
        ...(editMode ? [] : [[fieldObjects.circumstance, fieldObjects.status]]),
        [
          fieldObjects.vaccine,
          ...(editMode
            ? [fieldObjects.schedule, fieldObjects.status, fieldObjects.recordedBy]
            : [fieldObjects.batch, fieldObjects.dateGiven, fieldObjects.injectionSite]),
        ],
        ...(editMode
          ? []
          : [[fieldObjects.country], [fieldObjects.facility, fieldObjects.recordedBy]]),
      ],
    },
    {
      name: 'other',
      condition: !routine && !notGiven && !givenElsewhere,
      fields: [
        [
          fieldObjects.vaccineName,
          ...(editMode
            ? [fieldObjects.facility, fieldObjects.recordedBy]
            : [
                fieldObjects.batch,
                fieldObjects.vaccineBrand,
                fieldObjects.disease,
                fieldObjects.dateGiven,
                fieldObjects.injectionSite,
              ]),
          fieldObjects.status,
        ],
        ...(editMode
          ? []
          : [
              [
                fieldObjects.area,
                fieldObjects.location,
                fieldObjects.department,
                fieldObjects.facility,
              ],
              [fieldObjects.givenBy, fieldObjects.recordedBy],
            ]),
      ],
    },
    {
      name: 'otherOverseas',
      condition: !routine && !notGiven && givenElsewhere,
      fields: [
        ...(editMode ? [] : [[fieldObjects.circumstance, fieldObjects.status]]),
        [
          fieldObjects.vaccineName,
          ...(editMode
            ? [fieldObjects.status, fieldObjects.facility, fieldObjects.recordedBy]
            : [
                fieldObjects.batch,
                fieldObjects.vaccineBrand,
                fieldObjects.disease,
                fieldObjects.dateGiven,
                fieldObjects.injectionSite,
              ]),
        ],
        ...(editMode
          ? []
          : [[fieldObjects.country], [fieldObjects.facility, fieldObjects.recordedBy]]),
      ],
    },
    {
      name: 'notGiven',
      condition: notGiven && routine,
      fields: [
        [
          fieldObjects.vaccine,
          fieldObjects.schedule,
          ...(editMode
            ? [fieldObjects.recordedBy]
            : [fieldObjects.reason, fieldObjects.dateRecorded]),
          fieldObjects.status,
        ],
        ...(editMode
          ? []
          : [
              [
                fieldObjects.area,
                fieldObjects.location,
                fieldObjects.department,
                fieldObjects.facility,
              ],
              [fieldObjects.supervisingClinician, fieldObjects.recordedBy],
            ]),
      ],
    },
    {
      name: 'notGivenOther',
      condition: notGiven && !routine,
      fields: [
        [
          fieldObjects.vaccineName,
          ...(editMode
            ? [fieldObjects.recordedBy]
            : [fieldObjects.disease, fieldObjects.reason, fieldObjects.dateRecorded]),
          fieldObjects.status,
        ],
        ...(editMode
          ? []
          : [
              [
                fieldObjects.area,
                fieldObjects.location,
                fieldObjects.department,
                fieldObjects.facility,
              ],
              [fieldObjects.supervisingClinician, fieldObjects.recordedBy],
            ]),
      ],
    },
  ];

  const modalVersion = modalVersions.find(modalType => modalType.condition === true);

  return modalVersion ? (
    <FieldsViewer labelValueFieldGroups={modalVersion.fields} editMode={editMode} />
  ) : (
    <ErrorMessage />
  );
};

export const ViewAdministeredVaccineModal = ({ open, onClose, vaccineRecord }) => {
  if (!vaccineRecord) return null;
  return (
    <Modal
      title={<TranslatedText stringId="vaccine.view.title" fallback="View vaccine record" />}
      open={open}
      onClose={onClose}
      cornerExitButton={false}
    >
      <ViewAdministeredVaccineContent vaccineRecord={vaccineRecord} />
      <ModalActionRow
        confirmText={<TranslatedText stringId="general.actions.cancel" fallback="Cancel" />}
        onConfirm={onClose}
      />
    </Modal>
  );
};
