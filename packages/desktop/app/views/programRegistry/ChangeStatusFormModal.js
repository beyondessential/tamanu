import React, { useState } from 'react';
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
import { PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { useSuggester } from '../../api';
import { foreignKey } from '../../utils/validation';
import { OutlinedButton } from '../../components/Button';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 70%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const ChangeStatusFormModal = ({ patientProgramRegistration }) => {
  const [openChangeStatusFormModal, setOpenChangeStatusFormModal] = useState(false);
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programId: patientProgramRegistration.programId },
  });
  const isRemoved =
    patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED;
  return (
    <>
      <OutlinedButton onClick={() => setOpenChangeStatusFormModal(true)} disabled={isRemoved}>
        Change Status
      </OutlinedButton>
      <Modal
        title="Change Status"
        open={openChangeStatusFormModal}
        onClose={() => setOpenChangeStatusFormModal(false)}
      >
        <Form
          onSubmit={() => {
            // console.log(data);
            setOpenChangeStatusFormModal(false);
          }}
          render={({ submitForm }) => {
            return (
              <div>
                <StyledFormGrid columns={1}>
                  <Field
                    name="programRegistryClinicalStatusId"
                    label="Status"
                    component={AutocompleteField}
                    suggester={programRegistryStatusSuggester}
                  />
                </StyledFormGrid>
                <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
                <ConfirmCancelRow
                  onConfirm={submitForm}
                  onCancel={() => setOpenChangeStatusFormModal(false)}
                />
              </div>
            );
          }}
          initialValues={{
            programRegistryClinicalStatusId:
              patientProgramRegistration.programRegistryClinicalStatusId,
          }}
          validationSchema={yup.object().shape({
            programRegistryClinicalStatusId: foreignKey().required('Status must be selected'),
          })}
        />
      </Modal>
    </>
  );
};
