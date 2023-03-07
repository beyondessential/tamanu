import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { VACCINE_STATUS } from 'shared/constants';
import { Modal } from './Modal';
import { ContentPane } from './ContentPane';
import { TextInput } from './Field';
import { FormGrid } from './FormGrid';
import { Colors } from '../constants';

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
  } = vaccineRecord;

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose}>
      <Container>
        <Divider />
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine name </Label>
          {'TODO'}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine brand </Label>
          {'TODO'}
        </DisplayField>
        <DisplayField>
          <Label>Disease </Label>
          {'TODO'}
        </DisplayField>
        <DisplayField>
          <Label>Batch </Label>
          {batch}
        </DisplayField>
        <DisplayField>
          <Label>Schedule </Label>
          {schedule}
        </DisplayField>
        <DisplayField>
          <Label>Date </Label>
          {date}
        </DisplayField>
        <DisplayField>
          <Label>Injection site </Label>
          {injectionSite}
        </DisplayField>
        <DisplayField>
          <Label>Country </Label>
          {'TODO'}
        </DisplayField>
        <DisplayField>
          <Label>Facility </Label>
          {location.facilityId}
        </DisplayField>
        <DisplayField>
          <Label>Area </Label>
          {location.locationGroup?.name}
        </DisplayField>
        <DisplayField>
          <Label>Location </Label>
          {location.name}
        </DisplayField>
        <DisplayField>
          <Label>Department </Label>
          {departmentId}
        </DisplayField>
        <DisplayField>
          <Label>Given by </Label>
          {givenBy}
        </DisplayField>
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
