import React from 'react';
import styled from 'styled-components';
import { Form, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';

import { ModalFormActionRow } from '../components/ModalActionRow';
import { TranslatedText } from '../components/Translation/TranslatedText';
import {
  SyndromicSurveillanceFields,
  SYNDROMIC_SURVEILLANCE_INITIAL_VALUES,
} from './SyndromicSurveillanceFields';

const FormContent = styled.div`
  font-size: 14px;
  line-height: 18px;
`;

export const SyndromicSurveillanceForm = React.memo(({ onCancel, onSave }) => (
  <Form
    onSubmit={onSave}
    initialValues={SYNDROMIC_SURVEILLANCE_INITIAL_VALUES}
    formType={FORM_TYPES.CREATE_FORM}
    render={({ submitForm }) => (
      <FormContent data-testid="formcontent-syndromic-surveillance">
        <FormGrid columns={1} data-testid="formgrid-syndromic-surveillance">
          <SyndromicSurveillanceFields data-testid="whitebox-syndromic-surveillance" />
          <ModalFormActionRow
            onConfirm={submitForm}
            onCancel={onCancel}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-confirm"
              />
            }
            cancelText={
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
                data-testid="translatedtext-cancel"
              />
            }
            data-testid="modalformactionrow-syndromic-surveillance"
          />
        </FormGrid>
      </FormContent>
    )}
    data-testid="form-syndromic-surveillance"
  />
));
