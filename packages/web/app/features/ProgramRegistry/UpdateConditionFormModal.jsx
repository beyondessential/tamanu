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
import { useAuth } from '../../contexts/Auth';
import { FormTable } from './FormTable';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import styled from 'styled-components';

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: #f3f5f7;
  }
`;

const useUpdateConditionMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation(
    data => {
      return api.post(
        `patient/${data.patientId}/programRegistration/${data.programRegistryId}/condition`,
        {
          ...data,
          clinicianId: currentUser.id,
        },
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['programRegistry', 'conditions']);
      },
    },
  );
};

const data = [
  {
    id: '6d8a0256-9987-4a69-9a42-109863d8346a',
    date: '2025-02-11 15:08:28',
    conditionCategory: 'Unknown',
    programRegistryId: 'programRegistry-maternalhealthregistry',
    programRegistryConditionId: 'prCondition-maternalhealthregistryanaemia',
    programRegistryCondition: {
      id: 'prCondition-maternalhealthregistryanaemia',
      code: 'maternalhealthregistryanaemia',
      name: 'Anaemia',
      programRegistryId: 'programRegistry-maternalhealthregistry',
    },
  },
];

export const UpdateConditionFormModal = ({
  onClose,
  patientProgramRegistration,
  patientProgramRegistrationConditions,
  programRegistryConditions,
  open,
}) => {
  const { mutateAsync: submit } = useUpdateConditionMutation();

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
        initialValues={{ programRegistryConditionId: data[0].conditionCategory }}
        render={({ submitForm, dirty }) => {
          const columns = [
            {
              title: 'Condition',
              accessor: ({ programRegistryCondition }) => programRegistryCondition.name,
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
                  name="programRegistryConditionId"
                  conditionId={programRegistryCondition.id}
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
                  name="programRegistryConditionChangeReason"
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
              <FormTable columns={columns} data={data} />
              {/*Todo: Add Condition category history*/}
              <ModalFormActionRow onConfirm={submitForm} onCancel={onClose} />
            </>
          );
        }}
        validationSchema={yup.object().shape({
          programRegistryConditionId: foreignKey()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="conditions.validation.conditionName.path"
                fallback="Condition"
              />,
            ),
        })}
      />
    </Modal>
  );
};
