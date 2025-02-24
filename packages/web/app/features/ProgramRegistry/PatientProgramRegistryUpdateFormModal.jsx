import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  Field,
  Form,
  FormSeparatorLine,
  Modal,
  ModalFormActionRow,
  TranslatedText,
} from '../../components';
import { useAuth } from '../../contexts/Auth';
import { useApi, useSuggester } from '../../api';
import { optionalForeignKey } from '../../utils/validation';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { FORM_TYPES } from '../../constants';

const Container = styled.div`
  //margin: auto;
  //margin-top: 30px;
`;

const useUpdateConditionMutation = (patientId, programRegistryId, conditionId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.put(
        `patient/${patientId}/programRegistration/${programRegistryId}/condition/${conditionId}`,
        data,
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'patient',
          patientId,
          'programRegistration',
          programRegistryId,
        ]);
      },
    },
  );
};

export const PatientProgramRegistryUpdateFormModal = ({
  patientProgramRegistration,
  onClose,
  open,
}) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });

  if (!patientProgramRegistration) return <></>;

  const changeStatus = async changedStatus => {
    const { ...rest } = patientProgramRegistration;
    delete rest.id;
    delete rest.date;

    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, ...changedStatus, date: getCurrentDateTimeString(), clinicianId: currentUser.id },
    );

    queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
    queryClient.invalidateQueries(['patient', patientProgramRegistration.patientId]);
    onClose();
  };

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patientProgramRegistry.updateModal.title"
          fallback="Update program registry"
        />
      }
      open={open}
      onClose={onClose}
      width="lg"
    >
      <Form
        showInlineErrorsOnly
        onSubmit={changeStatus}
        render={({ dirty }) => {
          return (
            <Container>
              <Field
                name="clinicalStatusId"
                label={<TranslatedText stringId="general.status.label" fallback="Status" />}
                component={AutocompleteField}
                suggester={programRegistryStatusSuggester}
              />
              <ModalFormActionRow onCancel={onClose} confirmDisabled={!dirty || isSubmitting} />
            </Container>
          );
        }}
        initialValues={{
          clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
        }}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          clinicalStatusId: optionalForeignKey(),
        })}
      />
    </Modal>
  );
};
