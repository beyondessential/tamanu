import React from 'react';
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
import styled from 'styled-components';
import { useTranslation } from '../../contexts/Translation.jsx';

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: #f3f5f7;
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
  const { mutateAsync: submit } = useUpdateConditionMutation(
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
        render={({ submitForm, dirty }) => {
          const columns = [
            {
              title: 'Condition',
              accessor: ({ programRegistryCondition }) => programRegistryCondition?.name,
            },
            {
              title: 'Date added',
              accessor: ({ date }) => <DateDisplay date={date} />,
            },
            {
              title: (
                <span id="condition-category-label">
                  Category <span style={{ color: Colors.alert }}> *</span>
                </span>
              ),
              width: 200,
              accessor: ({ programRegistryCondition }) => (
                <ProgramRegistryConditionCategoryField
                  name="conditionCategory"
                  conditionId={programRegistryCondition?.id}
                  ariaLabelledby="condition-category-label"
                  required
                />
              ),
            },
            {
              title: (
                <span id="condition-category-change-reason-label">
                  Reason for change (if applicable)
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
              <FormTable columns={columns} data={condition ? [condition] : []} />
              {/*Todo: Add Condition category history*/}
              <ModalFormActionRow onConfirm={submitForm} onCancel={onClose} />
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
