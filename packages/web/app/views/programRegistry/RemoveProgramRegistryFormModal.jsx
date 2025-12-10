import React from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import {
  DateDisplay,
  FormSeparatorLine,
} from '../../components';
import {
  ConfirmCancelRow,
  TranslatedReferenceData,
  Modal,
  TranslatedText,
} from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { useUpdateProgramRegistryMutation } from '../../api/mutations';
import { useAuth } from '../../contexts/Auth';

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
  border: 1px solid ${Colors.outline};
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
  const { patientId, id } = patientProgramRegistration;
  const { currentUser } = useAuth();
  const { mutateAsync } = useUpdateProgramRegistryMutation(patientId, id);

  if (!patientProgramRegistration) return <></>;

  const remove = async () => {
    await mutateAsync({
      clinicianId: currentUser?.id,
      registrationStatus: REGISTRATION_STATUSES.INACTIVE,
    });
    onClose();
  };

  return (
    <Modal
      width="md"
      title={
        <TranslatedText
          stringId="programRegistry.modal.removeProgram.title"
          fallback="Remove patient"
          data-testid="translatedtext-de7a"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-vav5"
    >
      <WarningDiv data-testid="warningdiv-y30i">
        <p>
          <TranslatedText
            stringId="programRegistry.modal.removeProgram.body"
            fallback="Please confirm you would like to remove the patient from the below program registry. Once
          a patient is removed, you will not be able to update the status or complete program forms."
            data-testid="translatedtext-fj0u"
          />
        </p>
      </WarningDiv>
      <InfoDiv data-testid="infodiv-drt2">
        <InfoColumn data-testid="infocolumn-448e">
          <Info data-testid="info-7vp5">
            <Label data-testid="label-5pdg">
              <TranslatedText
                stringId="programRegistry.programRegistry.label"
                fallback="Program registry"
                data-testid="translatedtext-7wrm"
              />
            </Label>
            <Value data-testid="value-clws">
              <TranslatedReferenceData
                fallback={patientProgramRegistration.programRegistry?.name}
                value={patientProgramRegistration.programRegistryId}
                category="programRegistry"
                placeholder="-"
                data-testid="translatedreferencedata-7rh5"
              />
            </Value>
          </Info>
          <Info data-testid="info-6gdv">
            <Label data-testid="label-7s6v">
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
                data-testid="translatedtext-pcl4"
              />
            </Label>
            <Value data-testid="value-jxu3">
              {patientProgramRegistration?.clinician?.displayName || '-'}
            </Value>
          </Info>
          <Info data-testid="info-32a6">
            <Label data-testid="label-618q">
              <TranslatedText
                stringId="programRegistry.clinicalStatus.label"
                fallback="Status"
                data-testid="translatedtext-qxed"
              />
            </Label>
            <Value data-testid="value-ixvy">
              <TranslatedReferenceData
                fallback={patientProgramRegistration.clinicalStatus?.name}
                value={patientProgramRegistration.clinicalStatus?.id}
                category="programRegistryClinicalStatus"
                placeholder="-"
                data-testid="translatedreferencedata-kazw"
              />
            </Value>
          </Info>
        </InfoColumn>
        <FormSeparatorVerticalLine data-testid="formseparatorverticalline-d4gm" />
        <InfoColumn data-testid="infocolumn-xjty">
          <Info data-testid="info-7bjt">
            <Label data-testid="label-d7me">
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
                data-testid="translatedtext-1e5f"
              />
            </Label>
            <Value data-testid="value-b3gm">
              <DateDisplay date={patientProgramRegistration.date} data-testid="datedisplay-ajfm" />
            </Value>
          </Info>
          <Info data-testid="info-e0w6">
            <Label data-testid="label-3y8d">
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
                data-testid="translatedtext-bgtu"
              />
            </Label>
            <Value data-testid="value-w0hu">
              {(patientProgramRegistration.registeringFacility
                ? patientProgramRegistration.registeringFacility?.name
                : patientProgramRegistration.facility?.name && (
                    <TranslatedReferenceData
                      fallback={patientProgramRegistration.facility.name}
                      value={patientProgramRegistration.facility.id}
                      category="facility"
                      data-testid="translatedreferencedata-ww3k"
                    />
                  )) || '-'}
            </Value>
          </Info>
        </InfoColumn>
      </InfoDiv>
      <FormSeparatorLine
        style={{ marginTop: '30px', marginBottom: '30px' }}
        data-testid="formseparatorline-8h39"
      />
      <ConfirmCancelRow onConfirm={remove} onCancel={onClose} data-testid="confirmcancelrow-t2qb" />
    </Modal>
  );
};
