import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import {
  Modal,
  ConfirmCancelRow,
  Form,
  FormSeparatorLine,
  FormGrid,
  AutocompleteField,
  Field,
} from '../../components';
import { useSuggester } from '../../api';
import { foreignKey } from '../../utils/validation';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 70%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const AddConditionFormModal = ({ onSubmit, onCancel, programRegistry, open }) => {
  const programRegistryConditionSuggester = useSuggester('programRegistryConditions', {
    baseQueryParameters: { programRegistryId: programRegistry.programId },
  });
  return (
    <Modal title="Add condition" open={open} onClose={onCancel}>
      <Form
        onSubmit={data => {
          onSubmit(data);
        }}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel();
          return (
            <div>
              <StyledFormGrid columns={1}>
                <Field
                  name="programRegistryConditionId"
                  label="Condition"
                  component={AutocompleteField}
                  suggester={programRegistryConditionSuggester}
                />
              </StyledFormGrid>
              <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
              <ConfirmCancelRow onConfirm={submitForm} onCancel={handleCancel} />
            </div>
          );
        }}
        validationSchema={yup.object().shape({
          programRegistryConditionId: foreignKey().required('Condition must be selected'),
        })}
      />
    </Modal>
  );
};
