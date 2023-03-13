import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';
import { Colors } from '../constants';

import { DateDisplay } from './DateDisplay';

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: ${Colors.white};
  margin: 0;
  position: relative;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  padding-top: 19px;
`;

const DisplayField = styled.div`
  width: 50%;
  padding-bottom: 20px;
  color: ${Colors.darkestText};
  font-weight: 500;
  padding-left: 30px;
  &:nth-of-type(even) {
    padding-left: 20px;
    border-left: 1px solid ${Colors.outline};
  }
`;

const Label = styled.div`
  font-weight: 400;
  color: ${Colors.midText};
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

  console.log(vaccineRecord)

  // this will become some actual logic to determine which version of the modal to show however the fields this depends on
  // are not yet available
  const routine = true;
  const other = false;

  const overseas = false;

  const notGiven = true;

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose} cornerExitButton={false}>
      <Container>
        {(routine || notGiven) && (
          <DisplayField>
            <Label>Vaccine </Label>
            {label || '-'}
          </DisplayField>
        )}

        {other && (
          <DisplayField>
            <Label>Vaccine name </Label>
            {vaccineName || '-'}
          </DisplayField>
        )}

        {other && (
          <DisplayField>
            <Label>Vaccine brand </Label>
            {vaccineBrand || '-'}
          </DisplayField>
        )}

        {other && (
          <DisplayField>
            <Label>Disease </Label>
            {disease || '-'}
          </DisplayField>
        )}

        {!notGiven && (
          <DisplayField>
            <Label>Batch </Label>
            {batch || '-'}
          </DisplayField>
        )}

        {!overseas && (routine || notGiven) && (
          <DisplayField>
            <Label>Schedule </Label>
            {schedule || '-'}
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

        {overseas && (
          <DisplayField>
            <Label>Country </Label>
            {'TODO' || '-'}
          </DisplayField>
        )}

        {notGiven && (
          <>
            <DisplayField>
              <Label>Supervising Clinician </Label>
              {'TODO' || '-'}
            </DisplayField>

            <DisplayField>
              <Label>Reason </Label>
              {'TODO' || '-'}
            </DisplayField>
          </>
        )}

        <DisplayField>
          <Label>Facility </Label>
          {location.facility.name || '-'}
        </DisplayField>

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

        {!overseas && !notGiven && (
          <DisplayField>
            <Label>Department </Label>
            {department.name || '-'}
          </DisplayField>
        )}

        {!overseas && !notGiven && (
          <DisplayField>
            <Label>Given by </Label>
            {givenBy || '-'}
          </DisplayField>
        )}

        <DisplayField>
          <Label>Recorded by </Label>
          {recorder?.displayName || '-'}
        </DisplayField>

        <DisplayField>
          <Label>Status </Label>
          {status || '-'}
        </DisplayField>
      </Container>
      <ModalActionRow confirmText="Close" onConfirm={onClose} />
    </Modal>
  );
};
