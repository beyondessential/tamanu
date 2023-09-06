import React from 'react';
import * as yup from 'yup';
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
import { useAuth } from '../../contexts/Auth';
import { foreignKey } from '../../utils/validation';

export const ChangeStatusFormModal = ({ onSubmit, onCancel, program, patient }) => {
  const { currentUser } = useAuth();
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programId: program.id },
  });
  return (
    <Modal title="Change Status" open>
      <Form
        onSubmit={data => {
          onSubmit({
            ...data,
            programId: program.id,
            clinicianId: currentUser.id,
            patientId: patient.id,
          })
        }}
        render={({ submitForm }) => {
          const handleCancel = () => onCancel && onCancel();
          return (
            <div>
              <FormGrid
                columns={1}
                style={{
                  gridColumn: '1 / -1',
                  width: '70%',
                  display: 'block',
                  margin: 'auto',
                  marginTop: '30px',
                }}
              >
                <Field
                  name="programRegistryClinicalStatusId"
                  label="Status"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                />
              </FormGrid>
              <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
              <ConfirmCancelRow onConfirm={submitForm} onCancel={handleCancel} />
            </div>
          );
        }}
        initialValues={{
          programRegistryClinicalStatusId: program.programRegistryClinicalStatusId,
        }}
        validationSchema={yup.object().shape({
          programRegistryClinicalStatusId: foreignKey('Status must be selected'),
        })}
      />
    </Modal>
  );
};
