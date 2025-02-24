import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AutocompleteField,
  DateDisplay,
  Field,
  Form,
  Heading5,
  Modal,
  ModalFormActionRow,
  TextField,
  TranslatedText,
} from '../../components';
import { useApi, useSuggester } from '../../api';
import { optionalForeignKey } from '../../utils/validation';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { Colors, FORM_TYPES } from '../../constants';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import { FormTable } from './FormTable';
import MuiDivider from '@material-ui/core/Divider';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries/index.js';

const Container = styled.div``;

const Divider = styled(MuiDivider)`
  margin: 10px 0;
`;

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: #f3f5f7;
  }
`;

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
`;

const useUpdateProgramRegistryMutation = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.post(`patient/${patientId}/programRegistration`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
        queryClient.invalidateQueries(['patient', patientId]);
      },
    },
  );
};

export const PatientProgramRegistryUpdateFormModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const { programRegistryId, patientId, clinicalStatusId } = patientProgramRegistration;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
  );
  const { data: conditions = [] } = usePatientProgramRegistryConditionsQuery(
    patientId,
    programRegistryId,
  );
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId },
  });

  const handleSubmit = async data => {
    await submit(data);
    onClose();
  };

  if (!patientProgramRegistration) return null;

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
        onSubmit={handleSubmit}
        render={({ dirty }) => {
          const columns = [
            {
              title: (
                <TranslatedText
                  stringId="patientProgramRegistry.updateConditionModal.condition"
                  fallback="Condition"
                />
              ),
              key: 'condition',
              accessor: ({ programRegistryCondition }) => programRegistryCondition?.name,
            },
            {
              title: (
                <TranslatedText
                  stringId="patientProgramRegistry.updateConditionModal.dateAdded"
                  fallback="Date added"
                />
              ),
              key: 'dateAdded',
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
              key: 'conditionCategory',
              accessor: ({ programRegistryCondition }, index) => (
                <ProgramRegistryConditionCategoryField
                  name={`conditions[${index}].conditionCategory`}
                  conditionId={programRegistryCondition?.id}
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
              key: 'reasonForChange',
              accessor: (row, index) => (
                <Field
                  name={`conditions[${index}].reasonForChange`}
                  ariaLabelledBy="condition-category-change-reason-label"
                  component={StyledTextField}
                  required
                  disabled={!dirty}
                />
              ),
            },
          ];

          return (
            <Container>
              <Field
                name="clinicalStatusId"
                label={<TranslatedText stringId="general.status.label" fallback="Status" />}
                component={StyledAutocompleteField}
                suggester={programRegistryStatusSuggester}
              />
              <Divider />
              <Heading5 mt={0} mb={1}>
                <TranslatedText
                  stringId="programRegistry.relatedConditions"
                  fallback="Related conditions"
                />
              </Heading5>
              <FormTable columns={columns} data={conditions} />
              <ModalFormActionRow onCancel={onClose} confirmDisabled={!dirty || isSubmitting} />
            </Container>
          );
        }}
        initialValues={{
          clinicalStatusId: clinicalStatusId,
        }}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          clinicalStatusId: optionalForeignKey(),
        })}
      />
    </Modal>
  );
};
