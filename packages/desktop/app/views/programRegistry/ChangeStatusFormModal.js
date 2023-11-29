import React from 'react';
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
import { useApi, useSuggester } from '../../api';
import { foreignKey } from '../../utils/validation';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 70%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const ChangeStatusFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  if (!patientProgramRegistration) return <></>;

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });

  const changeStatus = async changedStatus => {
    const { id, date, ...rest } = patientProgramRegistration;
    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, ...changedStatus },
    );

    queryClient.invalidateQueries([`infoPaneListItem-Program Registry`]);
    onClose();
  };
  return (
    <>
      <Modal title="Change Status" open={open} onClose={onClose}>
        <Form
          onSubmit={changeStatus}
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
                <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
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
