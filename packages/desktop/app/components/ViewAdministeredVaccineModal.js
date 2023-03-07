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
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
        <DisplayField>
          <Label>Vaccine </Label>
          {label}
        </DisplayField>
      </Container>
    </Modal>
  );
};
