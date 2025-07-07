import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
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
import { RecordedInErrorWarningModal } from './RecordedInErrorWarningModal';
import { ConditionHistoryTable } from './ConditionHistoryTable';
import Divider from '@material-ui/core/Divider';
import { useSettings } from '../../contexts/Settings';

const StyledFormTable = styled(FormTable)`
  margin-top: 1rem;
  margin-bottom: 1rem;
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
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const { id: conditionId, patientProgramRegistrationId, conditionCategory } = condition;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateConditionMutation(
    patientProgramRegistrationId,
    conditionId,
  );

  const areAuditChangesEnabled = getSetting('audit.changes.enabled');

  const handleConfirmedSubmit = async values => {
    await submit(values);
    setWarningOpen(false);
    onClose();
  };

  const handleSubmit = async values => {
    if (values.conditionCategory === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR) {
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
        initialValues={{ conditionCategory: conditionCategory }}
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
              accessor: ({ programRegistryCondition }) => programRegistryCondition?.name,
            },
            {
              title: (
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.dateAdded"
                  fallback="Date added"
                />
              ),
              width: 140,
              accessor: ({ date }) => <DateDisplay date={date} />,
            },
            {
              title: (
                <span id="condition-category-label">
                  <TranslatedText
                    stringId="programRegistry.updateConditionModal.category"
                    fallback="Category"
                  />
                  <span style={{ color: Colors.alert }}> *</span>
                </span>
              ),
              width: 180,
              accessor: ({ programRegistryCondition }) => (
                <ProgramRegistryConditionCategoryField
                  name="conditionCategory"
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
              {areAuditChangesEnabled && (
                <>
                  <Divider />
                  <ConditionHistoryTable historyData={condition?.history} />
                </>
              )}
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
          conditionCategory: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
        })}
      />
    </Modal>
  );
};
