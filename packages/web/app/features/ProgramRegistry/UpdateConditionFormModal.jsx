import Divider from '@material-ui/core/Divider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES, PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import {
  DateDisplay,
  Field,
  Form,
  Modal,
  RequiredOrnament,
  TextField,
  TranslatedReferenceData,
  TranslatedText,
  useApi,
  useTranslation,
} from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { useProgramRegistryConditionCategoriesQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';
import { ModalFormActionRow } from '../../components';
import { Colors } from '../../constants/styles';
import { foreignKey } from '../../utils/validation';
import { ConditionHistoryTable } from './ConditionHistoryTable';
import { FormTable } from './FormTable';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import { RecordedInErrorWarningModal } from './RecordedInErrorWarningModal';

const StyledFormTable = styled(FormTable)`
  margin-block: 1rem;
`;

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
  }
`;

const useUpdateConditionMutation = (patientProgramRegistrationId, conditionId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.put(`patient/programRegistration/condition/${conditionId}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'patient',
          'programRegistration',
          patientProgramRegistrationId,
        ]);
      },
    },
  );
};

export const UpdateConditionFormModal = ({ onClose, open, condition = {} }) => {
  const [warningOpen, setWarningOpen] = useState(false);
  const { getTranslation } = useTranslation();
  const {
    id: conditionId,
    patientProgramRegistrationId,
    programRegistryCondition,
    programRegistryConditionCategory,
  } = condition;
  const programRegistryId = programRegistryCondition?.programRegistryId;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateConditionMutation(
    patientProgramRegistrationId,
    conditionId,
  );
  const { data: conditionCategories } =
    useProgramRegistryConditionCategoriesQuery(programRegistryId);

  const handleConfirmedSubmit = async values => {
    await submit(values);
    setWarningOpen(false);
    onClose();
  };

  const handleSubmit = async values => {
    const recordedInErrorId = conditionCategories?.find(
      category => category.code === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
    )?.id;

    if (values.programRegistryConditionCategoryId === recordedInErrorId) {
      setWarningOpen(true);
    } else {
      await handleConfirmedSubmit(values);
    }
  };

  return (
    <Modal
      width="lg"
      title={
        <TranslatedText
          stringId="programRegistry.updateConditionModal.title"
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
        initialValues={{ programRegistryConditionCategoryId: programRegistryConditionCategory?.id }}
        render={({ dirty, values }) => {
          const columns = [
            {
              title: (
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.condition"
                  fallback="Condition"
                />
              ),
              width: 220,
              accessor: ({ programRegistryCondition }) => (
                <span>
                  <TranslatedReferenceData
                    value={programRegistryCondition?.id}
                    fallback={programRegistryCondition?.name}
                    category="programRegistryCondition"
                  />
                </span>
              ),
            },
            {
              title: (
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.dateAdded"
                  fallback="Date added"
                />
              ),
              width: 140,
              accessor: ({ date }) => <DateDisplay date={trimToDate(date)} />,
            },
            {
              title: (
                <span id="condition-category-label">
                  <TranslatedText
                    stringId="programRegistry.updateConditionModal.category"
                    fallback="Category"
                  />
                  <RequiredOrnament />
                </span>
              ),
              width: 180,
              accessor: ({ programRegistryCondition }) => (
                <ProgramRegistryConditionCategoryField
                  name="programRegistryConditionCategoryId"
                  programRegistryId={programRegistryId}
                  disabled={!programRegistryCondition?.id}
                  disabledTooltipText={getTranslation(
                    'programRegistry.relatedConditionsCategory.tooltip',
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
                    stringId="programRegistry.updateConditionModal.reasonForChange"
                    fallback="Reason for change (if applicable)"
                  />
                </span>
              ),
              width: 240,
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
              <StyledFormTable columns={columns} data={[condition]} />
              <>
                <Divider />
                <ConditionHistoryTable
                  historyData={condition?.history}
                  programRegistryId={programRegistryId}
                />
              </>
              <ModalFormActionRow onCancel={onClose} confirmDisabled={!dirty || isSubmitting} />
              <RecordedInErrorWarningModal
                open={warningOpen}
                onClose={() => setWarningOpen(false)}
                items={[
                  {
                    id: condition.programRegistryConditionId,
                    name: condition.programRegistryCondition?.name,
                  },
                ]}
                onConfirm={async () => {
                  // Manually pass the values to the confirmed submit function
                  await handleConfirmedSubmit(values);
                }}
              />
            </>
          );
        }}
        validationSchema={yup.object().shape({
          programRegistryConditionCategoryId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
        })}
      />
    </Modal>
  );
};
