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

export const ChangeStatusFormModal = ({ onSubmit, onCancel, programRegistry, open }) => {
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: programRegistry.id },
  });
  return (
    <Modal title="Change Status" open={open}>
      <Form
        onSubmit={data => {
          onSubmit(data);
        }}
        render={({ submitForm }) => {
          const handleCancel = () => onCancel();
          return (
            <div>
              <StyledFormGrid columns={1} style={{}}>
                <Field
                  name="programRegistryClinicalStatusId"
                  label="Status"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                />
              </StyledFormGrid>
              <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
              <ConfirmCancelRow onConfirm={submitForm} onCancel={handleCancel} />
            </div>
          );
        }}
        initialValues={{
          programRegistryClinicalStatusId: programRegistry.programRegistryClinicalStatusId,
        }}
        validationSchema={yup.object().shape({
          programRegistryClinicalStatusId: foreignKey().required('Status must be selected'),
        })}
      />
    </Modal>
  );
};
