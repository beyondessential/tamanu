import React from 'react';
import styled from 'styled-components';
import { Modal, ConfirmCancelRow, DateDisplay, FormSeparatorLine } from '../../components';
import { Colors } from '../../constants';

const WarningDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  p {
    text-align: start;
  }
`;

const InfoDiv = styled.div`
  background-color: ${Colors.white};
  display: flex;
  flex-direction: row;
  justify-content: center-between;
  width: 100%;
  border: 1px solid ${Colors.softOutline};
  border-radius: 5px;
`;

const InfoColum = styled.div`
  display: flex;
  width: 50%;
  flex-direction: column;
  justify-content: flex-start;
`;

const Info = styled.div`
  margin: 10px 20px;
`;

const Label = styled.p`
  color: ${Colors.softText};
  line-height: 10px;
`;

const Value = styled.p`
  color: ${Colors.darkestText};
  line-height: 10px;
`;

export const RemoveProgramRegistryFormModal = ({
  patientProgramRegistration,
  onSubmit,
  onCancel,
  open,
}) => {
  return (
    <Modal title="Remove patient" open={open} onClose={onCancel}>
      <div>
        <WarningDiv>
          <p>
            Please confirm you would like to remove the patient from the below program registry.
            Once a patient is removed, you will not be able to update the status or complete program
            forms.
          </p>
        </WarningDiv>

        <InfoDiv>
          <InfoColum>
            <Info>
              <Label>Program registry</Label>
              <Value>{patientProgramRegistration.name}</Value>
            </Info>
            <Info>
              <Label>Date of registration</Label>
              <Value>
                <DateDisplay date={patientProgramRegistration.date} />
              </Value>
            </Info>
            <Info>
              <Label>Registering facility</Label>
              <Value>{patientProgramRegistration.registeringFacility.name}</Value>
            </Info>
          </InfoColum>
          <InfoColum>
            <Info>
              <Label>Status</Label>
              <Value>{patientProgramRegistration.programRegistryClinicalStatus.name}</Value>
            </Info>
            <Info>
              <Label>Registered by</Label>
              <Value>{patientProgramRegistration.clinician.displayName}</Value>
            </Info>
          </InfoColum>
        </InfoDiv>
        <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
        <ConfirmCancelRow onConfirm={onSubmit} onCancel={onCancel} />
      </div>
    </Modal>
  );
};
