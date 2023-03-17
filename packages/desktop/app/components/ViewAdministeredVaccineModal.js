import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';

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

export const ViewAdministeredVaccineModal = ({ open, onClose, vaccineRecord }) => {
  if (!vaccineRecord) return null;

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
  } = vaccineRecord;

  // this will become some actual logic to determine which version of the modal to show however the fields this depends on
  // are not yet available
  const routine = true;
  const overseas = false;
  const notGiven = false;

  const fieldObjects = {
    vaccine: { label: 'Vaccine', value: vaccineLabel || '-' },
    batch: { label: 'Batch', value: batch || '-' },
    schedule: { label: 'Schedule', value: schedule || '-' },
    date: { label: 'Date recorder', value: <DateDisplay date={date} /> },
    injectionSite: { label: 'Injection site', value: injectionSite || '-' },
    area: { label: 'Area', value: location.locationGroup?.name || '-' },
    location: { label: 'Location', value: location.name || '-' },
    department: { label: 'Department', value: department.name || '-' },
    facility: { label: 'Facility', value: location.facility.name || '-' },
    givenBy: { label: 'Given by', value: givenBy || '-' },
    recordedBy: { label: 'Recorded by', value: recorder?.displayName || '-' },
    vaccineName: { label: 'Vaccine name', value: vaccineName || '-' },
    vaccineBrand: { label: 'Vaccine brand', value: vaccineBrand || '-' },
    disease: { label: 'Disease', value: disease || '-' },
    status: { label: 'Status', value: status || '-' },
    circumstance: { label: 'Circumstance', value: 'TODOTODOTODO' },
    country: { label: 'Country', value: 'TODOTODOTODO' },
    reason: { label: 'Reason', value: 'TODOTODOTODO' },
  };

  const modalVersions = [
    {
      name: 'routine',
      condition: routine && !notGiven && !overseas,
      fields: [
        [
          fieldObjects.vaccine,
          fieldObjects.batch,
          fieldObjects.schedule,
          fieldObjects.status,
          fieldObjects.date,
          fieldObjects.injectionSite,
        ],
        [fieldObjects.area, fieldObjects.location, fieldObjects.department, fieldObjects.facility],
        [fieldObjects.givenBy, fieldObjects.recordedBy],
      ],
    },
    {
      name: 'routineOverseas',
      condition: routine && !notGiven && overseas,
      fields: [
        [fieldObjects.circumstance, fieldObjects.status],
        [fieldObjects.vaccine, fieldObjects.batch, fieldObjects.date, fieldObjects.injectionSite],
        [fieldObjects.country],
        [fieldObjects.facility, fieldObjects.recordedBy],
      ],
    },
    {
      name: 'other',
      condition: !routine && !notGiven && !overseas,
      fields: [
        [
          fieldObjects.vaccineName,
          fieldObjects.batch,
          fieldObjects.vaccineBrand,
          fieldObjects.disease,
          fieldObjects.date,
          fieldObjects.injectionSite,
          fieldObjects.status,
        ],
        [fieldObjects.area, fieldObjects.location, fieldObjects.department, fieldObjects.facility],
        [fieldObjects.givenBy, fieldObjects.recordedBy],
      ],
    },
    {
      name: 'otherOverseas',
      condition: !routine && !notGiven && overseas,
      fields: [
        [fieldObjects.circumstance, fieldObjects.status],
        [
          fieldObjects.vaccineName,
          fieldObjects.batch,
          fieldObjects.vaccineBrand,
          fieldObjects.disease,
          fieldObjects.date,
          fieldObjects.injectionSite,
        ],
        [fieldObjects.country],
        [fieldObjects.facility, fieldObjects.recordedBy],
      ],
    },
    {
      name: 'notGiven',
      condition: notGiven,
      fields: [
        [
          fieldObjects.vaccine,
          fieldObjects.schedule,
          fieldObjects.reason,
          fieldObjects.date,
          fieldObjects.status,
        ],
        [fieldObjects.area, fieldObjects.location, fieldObjects.department, fieldObjects.facility],
        [fieldObjects.givenBy, fieldObjects.recordedBy],
      ],
    },
  ];

  const modalVersion = modalVersions.find(modalType => modalType.condition === true);

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose} cornerExitButton={false}>
      <Container>
        {modalVersion.fields.map(fieldGroup => (
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
      <ModalActionRow confirmText="Close" onConfirm={onClose} />
    </Modal>
  );
};
