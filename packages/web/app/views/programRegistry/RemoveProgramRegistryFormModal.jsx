import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { ConfirmCancelRow, DateDisplay, FormSeparatorLine, Modal } from '../../components';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';

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
  padding: 22px 30px;
`;

const InfoColumn = styled.div`
  display: flex;
  width: 50%;
  flex-direction: column;
  justify-content: flex-start;
`;

export const FormSeparatorVerticalLine = styled.hr`
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1px solid ${Colors.outline};
  margin: 22px;
`;

const Info = styled.div`
  margin: 10px 20px;
`;

const Label = styled.div`
  color: ${Colors.midText};
`;

const Value = styled.div`
  color: ${Colors.darkestText};
  font-weight: 500;
`;

export const RemoveProgramRegistryFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  if (!patientProgramRegistration) return <></>;

  const remove = async () => {
    const { ...rest } = patientProgramRegistration;
    delete rest.id;
    delete rest.date;

    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      {
        ...rest,
        registrationStatus: REGISTRATION_STATUSES.INACTIVE,
        date: getCurrentDateTimeString(),
      },
    );

    queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
    onClose();
  };

  return (
    <Modal width="md" title="Remove patient" open={open} onClose={onClose}>
      {/* <div> */}
      <WarningDiv>
        <p>
          Please confirm you would like to remove the patient from the below program registry. Once
          a patient is removed, you will not be able to update the status or complete program forms.
        </p>
      </WarningDiv>

      <InfoDiv>
        <InfoColumn>
          <Info>
            <Label>Program registry</Label>
            <Value>{patientProgramRegistration.programRegistry?.name || '-'}</Value>
          </Info>
          <Info>
            <Label>Registered by</Label>
            <Value>{patientProgramRegistration?.clinician?.displayName || '-'}</Value>
          </Info>
          <Info>
            <Label>Status</Label>
            <Value>{patientProgramRegistration.clinicalStatus?.name || '-'}</Value>
          </Info>
        </InfoColumn>
        <FormSeparatorVerticalLine />
        <InfoColumn>
          <Info>
            <Label>Date of registration</Label>
            <Value>
              <DateDisplay date={patientProgramRegistration.date} />
            </Value>
          </Info>
          <Info>
            <Label>Registering facility</Label>
            <Value>
              {(patientProgramRegistration.registeringFacility
                ? patientProgramRegistration.registeringFacility?.name
                : patientProgramRegistration.facility?.name) || '-'}
            </Value>
          </Info>
        </InfoColumn>
      </InfoDiv>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={remove} onCancel={onClose} />
      {/* </div> */}
    </Modal>
  );
};
