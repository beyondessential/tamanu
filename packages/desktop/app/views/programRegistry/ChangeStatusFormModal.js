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

export const ChangeStatusFormModal = ({ patientProgramRegistration, onSubmit, onCancel, open }) => {
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });
  return (
    <>
      <Modal title="Change Status" open={open} onClose={() => onCancel()}>
        <Form
          onSubmit={data => {
            onSubmit(data);
          }}
          render={({ submitForm }) => {
            return (
              <div>
                <StyledFormGrid columns={1}>
                  <Field
                    name="clinicalStatusId"
                    label="Status"
                    component={AutocompleteField}
                    suggester={programRegistryStatusSuggester}
                  />
                </StyledFormGrid>
                <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
                <ConfirmCancelRow onConfirm={submitForm} onCancel={() => onCancel()} />
              </div>
            );
          }}
          initialValues={{
            clinicalStatusId: patientProgramRegistration.clinicalStatusId,
          }}
          validationSchema={yup.object().shape({
            clinicalStatusId: foreignKey().required('Status must be selected'),
          })}
        />
      </Modal>
    </>
  );
};
