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
    scheduledVaccine: { label, schedule },
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
  const routine = false;
  const overseas = true;
  const notGiven = false;

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose} cornerExitButton={false}>
      <Container>
        {overseas && (
          <FieldGroup>
            <DisplayField>
              <Label>Circumstance </Label>
              {'TODO' || '-'}
            </DisplayField>

            <DisplayField>
              <Label>Status </Label>
              {'TODO' || '-'}
            </DisplayField>
          </FieldGroup>
        )}

        <FieldGroup>
          {(routine || notGiven) && (
            <DisplayField>
              <Label>Vaccine </Label>
              {label || '-'}
            </DisplayField>
          )}

          {!routine && (
            <DisplayField>
              <Label>Vaccine name </Label>
              {vaccineName || '-'}
            </DisplayField>
          )}

          {!notGiven && (
            <DisplayField>
              <Label>Batch </Label>
              {batch || '-'}
            </DisplayField>
          )}

          {!routine && (
            <DisplayField>
              <Label>Vaccine brand </Label>
              {vaccineBrand || '-'}
            </DisplayField>
          )}

          {!routine && (
            <DisplayField>
              <Label>Disease </Label>
              {disease || '-'}
            </DisplayField>
          )}

          {!overseas && (routine || notGiven) && (
            <DisplayField>
              <Label>Schedule </Label>
              {schedule || '-'}
            </DisplayField>
          )}

          {routine && !notGiven && !overseas && (
            <DisplayField>
              <Label>Status </Label>
              {status || '-'}
            </DisplayField>
          )}

          {notGiven && (
            <DisplayField>
              <Label>Reason </Label>
              {'TODO' || '-'}
            </DisplayField>
          )}

          <DisplayField>
            <Label>Date </Label>
            <DateDisplay date={date} />
          </DisplayField>

          {!notGiven && (
            <DisplayField>
              <Label>Injection site </Label>
              {injectionSite || '-'}
            </DisplayField>
          )}

          {((!overseas && !routine) || notGiven) && (
            <DisplayField>
              <Label>Status </Label>
              {status || '-'}
            </DisplayField>
          )}
        </FieldGroup>

        <FieldGroup>
          {!overseas && (
            <DisplayField>
              <Label>Area </Label>
              {location.locationGroup?.name || '-'}
            </DisplayField>
          )}

          {!overseas && (
            <DisplayField>
              <Label>Location </Label>
              {location.name || '-'}
            </DisplayField>
          )}

          {!overseas && (
            <DisplayField>
              <Label>Department </Label>
              {department.name || '-'}
            </DisplayField>
          )}

          {!overseas && (
            <DisplayField>
              <Label>Facility </Label>
              {location.facility.name || '-'}
            </DisplayField>
          )}

          {overseas && (
            <DisplayField>
              <Label>Country </Label>
              {'TODO' || '-'}
            </DisplayField>
          )}
        </FieldGroup>

        <FieldGroup>
          {!overseas && !notGiven && (
            <DisplayField>
              <Label>Given by </Label>
              {givenBy || '-'}
            </DisplayField>
          )}

          {notGiven && (
            <DisplayField>
              <Label>Supervising Clinician </Label>
              {'TODO' || '-'}
            </DisplayField>
          )}

          {overseas && (
            <DisplayField>
              <Label>Country </Label>
              {'TODO' || '-'}
            </DisplayField>
          )}

          <DisplayField>
            <Label>Recorded by </Label>
            {recorder?.displayName || '-'}
          </DisplayField>
        </FieldGroup>
      </Container>
      <ModalActionRow confirmText="Close" onConfirm={onClose} />
    </Modal>
  );
};
