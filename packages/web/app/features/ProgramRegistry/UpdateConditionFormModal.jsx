import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TextField,
  Field,
  Form,
  Modal,
  TranslatedText,
  DateDisplay,
  ModalFormActionRow,
} from '../../components';
import { useApi } from '../../api';
import { foreignKey } from '../../utils/validation';
import { Colors, FORM_TYPES } from '../../constants';
import { FormTable } from './FormTable';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import { useTranslation } from '../../contexts/Translation';

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
  }
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

export const UpdateConditionFormModal = ({ onClose, open, condition = {} }) => {
  const { getTranslation } = useTranslation();
  const { id: conditionId, patientId, programRegistryId, conditionCategory } = condition;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateConditionMutation(
    patientId,
    programRegistryId,
    conditionId,
  );
  const handleSubmit = async values => {
    await submit(values);
    onClose();
  };

  return (
    <Modal
      width="lg"
      title={
        <TranslatedText
          stringId="patientProgramRegistry.updateConditionModal.title"
          fallback="Update condition"
        />
      }
      open={open}
      onClose={onClose}
    >
      <Form
        showInlineErrorsOnly
        onSubmit={handleSubmit}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{ conditionCategory: conditionCategory }}
        render={({ dirty }) => {
          const columns = [
            {
              title: (
                <TranslatedText
                  stringId="patientProgramRegistry.updateConditionModal.condition"
                  fallback="Condition"
                />
              ),
              accessor: ({ programRegistryCondition }) => programRegistryCondition?.name,
            },
            {
              title: (
                <TranslatedText
                  stringId="patientProgramRegistry.updateConditionModal.dateAdded"
                  fallback="Date added"
                />
              ),
              accessor: ({ date }) => <DateDisplay date={date} />,
            },
            {
              title: (
                <span id="condition-category-label">
                  <TranslatedText
                    stringId="patientProgramRegistry.updateConditionModal.category"
                    fallback="Category"
                  />
                  <span style={{ color: Colors.alert }}> *</span>
                </span>
              ),
              width: 200,
              accessor: ({ programRegistryCondition }) => (
                <ProgramRegistryConditionCategoryField
                  name="conditionCategory"
                  disabled={!programRegistryCondition?.id}
                  disabledTooltipText={getTranslation(
                    'patientProgramRegistry.relatedConditionsCategory.tooltip',
                    'Select a condition to add related categories',
                  )}
                  ariaLabelledby="condition-category-label"
                  required
                />
              ),
            },
            {
              title: (
                <span id="condition-category-change-reason-label">
                  <TranslatedText
                    stringId="patientProgramRegistry.updateConditionModal.reasonForChange"
                    fallback="Reason for change (if applicable)"
                  />
                </span>
              ),
              width: 300,
              accessor: () => (
                <Field
                  name="reasonForChange"
                  ariaLabelledBy="condition-category-change-reason-label"
                  component={StyledTextField}
                  required
                  disabled={!dirty}
                />
              ),
            },
          ];

          return (
            <>
              <FormTable columns={columns} data={[condition]} />
              {/*Todo: Add Condition category history in https://linear.app/bes/issue/SAV-871/create-condition-view-history-modal */}
              <ModalFormActionRow onCancel={onClose} confirmDisabled={!dirty || isSubmitting} />
            </>
          );
        }}
        validationSchema={yup.object().shape({
          conditionCategory: foreignKey()
            .required()
            .label(getTranslation('validation.required.inline', '*Required')),
        })}
      />
    </Modal>
  );
};
