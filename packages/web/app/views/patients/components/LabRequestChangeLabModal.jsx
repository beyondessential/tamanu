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
import { TranslatedText } from '../../../components/Translation/TranslatedText';

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
          validationSchema={yup.object().shape({
            labTestLaboratoryId: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="lab.laboratory.label"
                  fallback="Laboratory"
                  data-test-id='translatedtext-zeb5' />,
              ),
          })}
          initialValues={{
            labTestLaboratoryId: labRequest?.labTestLaboratoryId,
          }}
          formType={FORM_TYPES.EDIT_FORM}
          render={({ submitForm }) => (
            <FormGrid columns={1}>
              <Field
                component={AutocompleteField}
                label={
                  <TranslatedText
                    stringId="lab.modal.changeLab.laboratory.label"
                    fallback="Laboratory"
                    data-test-id='translatedtext-j155' />
                }
                name="labTestLaboratoryId"
                suggester={laboratorySuggester}
                required
                data-test-id='field-ltr9' />
              <ModalFormActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onClose} />
            </FormGrid>
          )}
        />
      </FormModal>
    );
  },
);
