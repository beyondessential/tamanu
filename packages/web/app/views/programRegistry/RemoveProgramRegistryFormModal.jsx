import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  ConfirmCancelRow,
  DateDisplay,
  FormSeparatorLine,
  Modal,
  TranslatedText,
} from '../../components';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { TranslatedReferenceData } from '../../components/Translation';
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
  justify-content: space-between;
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
    <Modal
      width="md"
      title={
        <TranslatedText
          stringId="programRegistry.modal.removeProgram.title"
          fallback="Remove patient"
          data-testid='translatedtext-r5zd' />
      }
      open={open}
      onClose={onClose}
    >
      <WarningDiv>
        <p data-testid='p-96ih'>
          <TranslatedText
            stringId="programRegistry.modal.removeProgram.body"
            fallback="Please confirm you would like to remove the patient from the below program registry. Once
          a patient is removed, you will not be able to update the status or complete program forms."
            data-testid='translatedtext-x6j2' />
        </p>
      </WarningDiv>
      <InfoDiv>
        <InfoColumn>
          <Info>
            <Label>
              <TranslatedText
                stringId="programRegistry.programRegistry.label"
                fallback="Program registry"
                data-testid='translatedtext-41dk' />
            </Label>
            <Value>
              <TranslatedReferenceData
                fallback={patientProgramRegistration.programRegistry?.name}
                value={patientProgramRegistration.programRegistryId}
                category="programRegistry"
                placeholder="-"
                data-testid='translatedreferencedata-1zbs' />
            </Value>
          </Info>
          <Info>
            <Label>
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
                data-testid='translatedtext-3z6e' />
            </Label>
            <Value>{patientProgramRegistration?.clinician?.displayName || '-'}</Value>
          </Info>
          <Info>
            <Label>
              <TranslatedText
                stringId="programRegistry.clinicalStatus.label"
                fallback="Status"
                data-testid='translatedtext-st03' />
            </Label>
            <Value>
              <TranslatedReferenceData
                fallback={patientProgramRegistration.clinicalStatus?.name}
                value={patientProgramRegistration.clinicalStatus?.id}
                category="programRegistryClinicalStatus"
                placeholder="-"
                data-testid='translatedreferencedata-3x70' />
            </Value>
          </Info>
        </InfoColumn>
        <FormSeparatorVerticalLine />
        <InfoColumn>
          <Info>
            <Label>
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
                data-testid='translatedtext-njs4' />
            </Label>
            <Value>
              <DateDisplay date={patientProgramRegistration.date} data-testid='datedisplay-kefg' />
            </Value>
          </Info>
          <Info>
            <Label>
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
                data-testid='translatedtext-b957' />
            </Label>
            <Value>
              {(patientProgramRegistration.registeringFacility
                ? patientProgramRegistration.registeringFacility?.name
                : patientProgramRegistration.facility?.name && (
                    <TranslatedReferenceData
                      fallback={patientProgramRegistration.facility.name}
                      value={patientProgramRegistration.facility.id}
                      category="facility"
                      data-testid='translatedreferencedata-zouy' />
                  )) || '-'}
            </Value>
          </Info>
        </InfoColumn>
      </InfoDiv>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={remove} onCancel={onClose} />
    </Modal>
  );
};
