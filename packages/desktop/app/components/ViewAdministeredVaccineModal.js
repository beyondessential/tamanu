import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { VACCINE_STATUS, VACCINE_STATUS_LABELS } from 'shared/constants';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';
import { useSuggester } from '../api';

import { DateDisplay } from './DateDisplay';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${Colors.white};
  margin: 0;
  position: relative;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

const DisplayField = styled.div`
  width: 50%;
  padding-bottom: 20px;
  color: ${Colors.darkestText};
  font-weight: 500;
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
  }
  padding-top: 20px;
`;

const FieldsViewer = ({ labelValueFieldGroups }) => (
  <Container>
    {labelValueFieldGroups.map(fieldGroup => (
      <FieldGroup>
        {fieldGroup.map(({ label, value }) => (
          <DisplayField>
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
    status,
    injectionSite,
    scheduledVaccine: { label: vaccineLabel, schedule },
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

  const vaccineCircumstanceSuggester = useSuggester('vaccineCircumstance');
  const [vaccineCircumstances, setVaccineCircumstances] = useState();

  useEffect(() => {
    // to avoid unnecessary API calls, these are the conditions that will show circumstance
    if (!editMode && givenElsewhere && circumstanceIds) {
      const circumstanceIdValues = Array.isArray(circumstanceIds)
        ? circumstanceIds
        : String(circumstanceIds)?.split(',') || [];
      Promise.all(
        circumstanceIdValues.map(circumstanceId =>
          vaccineCircumstanceSuggester.fetchCurrentOption(circumstanceId),
        ),
      ).then(circumstances => {
        setVaccineCircumstances(circumstances?.map(circumstance => circumstance?.label));
      });
    }
  }, [vaccineCircumstanceSuggester, circumstanceIds, editMode, givenElsewhere]);

  if (!vaccineRecord) return null;

  const fieldObjects = {
    vaccine: { label: 'Vaccine', value: vaccineLabel || '-' },
    batch: { label: 'Batch', value: batch || '-' },
    schedule: { label: 'Schedule', value: schedule || '-' },
    dateRecorded: { label: 'Date recorded', value: <DateDisplay date={date} /> },
    dateGiven: { label: 'Date given', value: <DateDisplay date={date} /> },
    injectionSite: { label: 'Injection site', value: injectionSite || '-' },
    area: { label: 'Area', value: location?.locationGroup?.name || '-' },
    location: { label: 'Location', value: location?.name || '-' },
    department: { label: 'Department', value: department?.name || '-' },
    facility: {
      label: 'Facility',
      value: location?.facility.name || encounter.location.facility.name || '-',
    },
    givenBy: { label: 'Given by', value: givenBy || '-' },
    supervisingClinician: { label: 'Supervising clincian', value: givenBy || '-' },
    recordedBy: { label: 'Recorded by', value: recorder?.displayName || '-' },
    vaccineName: { label: 'Vaccine name', value: vaccineName || '-' },
    vaccineBrand: { label: 'Vaccine brand', value: vaccineBrand || '-' },
    disease: { label: 'Disease', value: disease || '-' },
    status: {
      label: 'Status',
      value: givenElsewhere ? 'Given elsewhere' : VACCINE_STATUS_LABELS[status] || '-',
    },
    country: { label: 'Country', value: givenBy || '-' },
    reason: { label: 'Reason', value: notGivenReason?.name || '-' },
    circumstance: { label: 'Circumstance', value: vaccineCircumstances?.join(', ') || '-' },
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
          fieldObjects.schedule,
          ...(editMode
            ? [fieldObjects.status, fieldObjects.recordedBy]
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
    <FieldsViewer labelValueFieldGroups={modalVersion.fields} />
  ) : (
    <ErrorMessage />
  );
};

export const ViewAdministeredVaccineModal = ({ open, onClose, vaccineRecord }) => {
  if (!vaccineRecord) return null;
  return (
    <Modal title="View vaccine record" open={open} onClose={onClose} disableHeaderCloseIcon>
      <ViewAdministeredVaccineContent vaccineRecord={vaccineRecord} />
      <ModalActionRow confirmText="Close" onConfirm={onClose} />
    </Modal>
  );
};
