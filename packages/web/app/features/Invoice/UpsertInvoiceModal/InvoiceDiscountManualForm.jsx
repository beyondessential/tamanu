import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';

import { TextField, Form, ConfirmCancelBackRow, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';

import { Field, NumberField } from '../../../components/Field';
import { TranslatedText } from '../../../components/Translation';
import { BodyText, Heading3 } from '../../../components/Typography';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

export const InvoiceDiscountManualForm = React.memo(
  ({ handleSubmit, onClose, handleBack, initialValues, isSubmitting }) => {
    const preventInvalid = event => {
      if (!event.target.validity.valid) {
        event.target.value = '';
      }
    };

    const onSubmit = data => {
      const percentage = data.percentage / 100;
      handleSubmit({ ...data, percentage });
    };

    return (
      <>
        <Heading3 mb="8px" data-testid="heading3-s8za">
          <TranslatedText
            stringId="invoice.modal.manualDiscount.subtitle"
            fallback="Manual patient discount"
            data-testid="translatedtext-6j6k"
          />
        </Heading3>
        <BodyText mb="20px" color="textTertiary" data-testid="bodytext-wdkl">
          <TranslatedText
            stringId="invoice.modal.manualDiscount.description"
            fallback="Please set the patient discount below. This discount will be applied to all eligible items on the invoice."
            data-testid="translatedtext-1c7y"
          />
        </BodyText>
        <Form
          onSubmit={onSubmit}
          render={({ submitForm }) => (
            <>
              <FormGrid columns={4} data-testid="formgrid-b3ss">
                <Field
                  name="percentage"
                  label={
                    <TranslatedText
                      stringId="invoice.modal.manualDiscount.discount.label"
                      fallback="Discount (%)"
                      data-testid="translatedtext-g317"
                    />
                  }
                  component={NumberField}
                  min={0}
                  max={100}
                  onInput={preventInvalid}
                  required
                  data-testid="field-zegl"
                />
                <Field
                  name="reason"
                  label={
                    <TranslatedText
                      stringId="invoice.modal.addDiscount.reason.label"
                      fallback="Reason for manual discount"
                      data-testid="translatedtext-fdk5"
                    />
                  }
                  component={TextField}
                  style={{ gridColumn: 'span 3' }}
                  data-testid="field-vp1c"
                />
              </FormGrid>
              <StyledDivider data-testid="styleddivider-if7z" />
              <ConfirmCancelBackRow
                onConfirm={submitForm}
                onCancel={onClose}
                onBack={handleBack}
                confirmText={
                  <TranslatedText
                    stringId="general.action.next"
                    fallback="Next"
                    data-testid="translatedtext-wyjl"
                  />
                }
                confirmDisabled={isSubmitting}
                data-testid="confirmcancelbackrow-biz9"
              />
            </>
          )}
          initialValues={initialValues}
          validationSchema={yup.object().shape({
            reason: yup.string(),
            percentage: yup
              .number()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="invoice.modal.manualDiscount.discount.label"
                  fallback="Discount (%)"
                  data-testid="translatedtext-7v96"
                />,
              ),
          })}
          formType={initialValues ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
          data-testid="form-n2wy"
        />
      </>
    );
  },
);
