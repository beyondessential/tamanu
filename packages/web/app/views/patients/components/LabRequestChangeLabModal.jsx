import React from 'react';
import * as yup from 'yup';

import { Form, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';

import { useSuggester } from '../../../api';
import {
  AutocompleteField,
  Field,
  FormModal,
  ModalFormActionRow,
} from '../../../components';
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
      <FormModal
        open={open}
        onClose={onClose}
        title="Change lab request laboratory"
        data-testid="formmodal-q2b0"
      >
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
                  data-testid="translatedtext-fxq6"
                />,
              ),
          })}
          initialValues={{
            labTestLaboratoryId: labRequest?.labTestLaboratoryId,
          }}
          formType={FORM_TYPES.EDIT_FORM}
          render={({ submitForm }) => (
            <FormGrid columns={1} data-testid="formgrid-xw6v">
              <Field
                component={AutocompleteField}
                label={
                  <TranslatedText
                    stringId="lab.modal.changeLab.laboratory.label"
                    fallback="Laboratory"
                    data-testid="translatedtext-xpwv"
                  />
                }
                name="labTestLaboratoryId"
                suggester={laboratorySuggester}
                required
                data-testid="field-36s0"
              />
              <ModalFormActionRow
                confirmText="Confirm"
                onConfirm={submitForm}
                onCancel={onClose}
                data-testid="modalformactionrow-i2uo"
              />
            </FormGrid>
          )}
          data-testid="form-om63"
        />
      </FormModal>
    );
  },
);
