import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  ConfirmCancelRow,
  Form,
  FormSeparatorLine,
  FormGrid,
  AutocompleteField,
  Field,
} from '../../components';
import { useApi } from '../../api';
import { foreignKey } from '../../utils/validation';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 70%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const AddConditionFormModal = ({ onSubmit, onCancel, patientProgramRegistration, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [options, setOptions] = useState([]);
  useEffect(() => {
    (async () => {
      const response = await api.get(
        `programRegistry/${patientProgramRegistration.programRegistryId}/conditions`,
      );
      setOptions(response.data.map(x => ({ label: x.name, value: x.id })));
    })();
  }, [patientProgramRegistration.programRegistryId, api]);

  return (
    <Modal title="Add condition" open={open} onClose={onCancel}>
      <Form
        onSubmit={async data => {
          await api.post(
            `patient/${encodeURIComponent(
              patientProgramRegistration.patientId,
            )}/programRegistration/${encodeURIComponent(
              patientProgramRegistration.programRegistryId,
            )}/condition`,
            data,
          );
          queryClient.invalidateQueries(['PatientProgramRegistryConditions']);
          onSubmit();
        }}
        render={({ submitForm }) => {
          const handleCancel = () => onCancel();
          return (
            <div>
              <StyledFormGrid columns={1}>
                <Field
                  name="programRegistryConditionId"
                  label="Condition"
                  component={AutocompleteField}
                  options={options}
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
