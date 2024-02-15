import React from 'react';
import * as yup from 'yup';

import { useSuggester } from '../../../api';
import {
  AutocompleteField,
  Field,
  Form,
  FormGrid,
  FormModal,
  ModalFormActionRow,
} from '../../../components';
import { FORM_TYPES } from '../../../constants';

const validationSchema = yup.object().shape({
  labTestLaboratoryId: yup.string().required('Laboratory is required'),
});

export const LabRequestChangeLabModal = React.memo(
  ({ labRequest, updateLabReq, open, onClose }) => {
    const laboratorySuggester = useSuggester('labTestLaboratory');

    const updateLab = async ({ labTestLaboratoryId }) => {
      await updateLabReq({
        labTestLaboratoryId,
      });
      onClose();
    };

    return (
      <FormModal open={open} onClose={onClose} title="Change lab request laboratory">
        <Form
          onSubmit={updateLab}
          validationSchema={validationSchema}
          initialValues={{
            labTestLaboratoryId: labRequest?.labTestLaboratoryId,
          }}
          formType={FORM_TYPES.EDIT_DATA_FORM}
          render={({ submitForm }) => (
            <FormGrid columns={1}>
              <Field
                component={AutocompleteField}
                label="Laboratory"
                name="labTestLaboratoryId"
                suggester={laboratorySuggester}
                required
              />
              <ModalFormActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onClose} />
            </FormGrid>
          )}
        />
      </FormModal>
    );
  },
);
