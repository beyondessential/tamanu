import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { VACCINE_STATUS } from 'shared/constants';
import { Modal } from './Modal';
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
  margin-bottom: 20px;
  color: ${Colors.darkestText};
  font-weight: 500;
  padding-left: 30px;
  &:nth-of-type(odd) {
    padding-left: 20px;
  }
`;

const Label = styled.div`
  font-weight: 400;
  color: ${Colors.midText};
`;

const Divider = styled.div`
  width: 1px;
  background-color: ${Colors.outline};
  position: absolute;
  top: 5%;
  left: 50%;
  height: 85%;
`;

export const ViewAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  if (!vaccineRecord) return null;

  const {
    status,
    injectionSite,
    scheduledVaccine: { label, schedule },
    recorder,
    givenBy,
    location,
    encounter,
    departmentId,
    date,
    batch,
    givenOverseas,
    vaccineName,
    vaccineBrand,
    disease,
  } = vaccineRecord;

  // this will become some actual logic to determine which version of the modal to show however the fields this depends on
  // are not yet available
  const routine = false;
  const other = true;
  const otherOverseas = false;
  const routineOverseas = false;
  const notGiven = false;

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose}>
      <Container>
        <Divider />
        {(routine || routineOverseas || notGiven) && (
          <DisplayField>
            <Label>Vaccine </Label>
            {label}
          </DisplayField>
        )}

        {(other || otherOverseas) && (
          <DisplayField>
            <Label>Vaccine name </Label>
            {vaccineName}
          </DisplayField>
        )}

        {(other || otherOverseas) && (
          <DisplayField>
            <Label>Vaccine brand </Label>
            {vaccineBrand}
          </DisplayField>
        )}

        {(other || otherOverseas) && (
          <DisplayField>
            <Label>Disease </Label>
            {disease}
          </DisplayField>
        )}

        {(routine || other || otherOverseas || routineOverseas) && (
          <DisplayField>
            <Label>Batch </Label>
            {batch}
          </DisplayField>
        )}

        {(routine || notGiven) && (
          <DisplayField>
            <Label>Schedule </Label>
            {schedule}
          </DisplayField>
        )}

        <DisplayField>
          <Label>Date </Label>
          <DateDisplay date={date} />
        </DisplayField>

        {(routine || other || otherOverseas || routineOverseas) && (
          <DisplayField>
            <Label>Injection site </Label>
            {injectionSite}
          </DisplayField>
        )}

        {(otherOverseas || routineOverseas) && (
          <DisplayField>
            <Label>Country </Label>
            {'TODO'}
          </DisplayField>
        )}

        {notGiven && (
          <>
            <DisplayField>
              <Label>Supervising Clinician </Label>
              {'TODO'}
            </DisplayField>

            <DisplayField>
              <Label>Reason </Label>
              {'TODO'}
            </DisplayField>
          </>
        )}

        <DisplayField>
          <Label>Facility </Label>
          {location.facilityId}
        </DisplayField>

        {(routine || other) && (
          <DisplayField>
            <Label>Area </Label>
            {location.locationGroup?.name}
          </DisplayField>
        )}

        {(routine || other) && (
          <DisplayField>
            <Label>Location </Label>
            {location.name}
          </DisplayField>
        )}

        {(routine || other) && (
          <DisplayField>
            <Label>Department </Label>
            {departmentId}
          </DisplayField>
        )}

        {(routine || other) && (
          <DisplayField>
            <Label>Given by </Label>
            {givenBy}
          </DisplayField>
        )}

        <DisplayField>
          <Label>Recorded by </Label>
          {recorder?.displayName || encounter?.examiner?.displayName}
        </DisplayField>

        <DisplayField>
          <Label>Status </Label>
          {status}
        </DisplayField>
      </Container>
    </Modal>
  );
};
