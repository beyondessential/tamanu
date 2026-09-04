import React from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';
import { Divider } from '@material-ui/core';
import {
  Form,
  FormGrid,
  FormSubmitCancelRow,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';

import { BodyText, FormModal } from '../../components';
import { Field } from '../../components/Field';
import { useTranslation } from '../../contexts/Translation';
import { notifySuccess } from '../../utils';

const StyledDivider = styled(Divider)`
  margin: 20px 0;
`;

const EmphasisedCount = styled.span`
  font-weight: 700;
  text-decoration: underline;
`;

// Sends the error log to the Tamanu support team. This is a first-pass mock: it only
// logs what would be sent, standing in until the real transport (and the store the
// error rows come from) is built.
async function sendErrorLog(values) {
  // eslint-disable-next-line no-console
  console.log('[Send error log] (mock)', values);
  return { success: true };
}

export const SendErrorLogButtonLabel = ({ count }) =>
  count === 1 ? (
    <TranslatedText stringId="systemErrors.action.sendErrorLog.singular" fallback="Send error log" />
  ) : (
    <TranslatedText stringId="systemErrors.action.sendErrorLog.plural" fallback="Send error logs" />
  );

const ReportingSubtitle = ({ count }) => (
  <BodyText color="textSecondary" data-testid="send-error-log-subtitle">
    <TranslatedText stringId="systemErrors.modal.subtitle.prefix" fallback="Reporting" />{' '}
    <EmphasisedCount>{count}</EmphasisedCount>{' '}
    {count === 1 ? (
      <TranslatedText
        stringId="systemErrors.modal.subtitle.suffix.singular"
        fallback="error to the Tamanu support team."
      />
    ) : (
      <TranslatedText
        stringId="systemErrors.modal.subtitle.suffix.plural"
        fallback="errors to the Tamanu support team."
      />
    )}
  </BodyText>
);

export const SendErrorLogModal = ({ open, onClose, errors }) => {
  const { getTranslation } = useTranslation();
  const count = errors.length;

  const handleSubmit = async values => {
    await sendErrorLog({ ...values, errors });
    onClose();
    notifySuccess(
      count === 1 ? (
        <TranslatedText stringId="systemErrors.modal.success.singular" fallback="Error log sent" />
      ) : (
        <TranslatedText stringId="systemErrors.modal.success.plural" fallback="Error logs sent" />
      ),
    );
  };

  return (
    <FormModal open={open} onClose={onClose} title={<SendErrorLogButtonLabel count={count} />}>
      <ReportingSubtitle count={count} />
      <StyledDivider />
      <Form
        onSubmit={handleSubmit}
        initialValues={{ additionalInformation: '', email: '' }}
        validationSchema={Yup.object().shape({
          additionalInformation: Yup.string(),
          email: Yup.string()
            .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
            .nullable(),
        })}
        suppressErrorDialog
        render={({ submitForm }) => (
          <>
            <FormGrid columns={1}>
              <Field
                name="additionalInformation"
                label={
                  <TranslatedText
                    stringId="systemErrors.modal.additionalInformation.label"
                    fallback="Additional information"
                  />
                }
                component={TextField}
                multiline
                minRows={4}
              />
            </FormGrid>
            <StyledDivider />
            <BodyText color="textSecondary" mb={2}>
              <TranslatedText
                stringId="systemErrors.modal.email.description"
                fallback="Enter your email if you're okay with our support team contacting you for further information."
              />
            </BodyText>
            <FormGrid columns={1}>
              <Field
                name="email"
                label={<TranslatedText stringId="systemErrors.modal.email.label" fallback="Email" />}
                component={TextField}
                type="email"
              />
            </FormGrid>
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onClose}
              confirmText={<SendErrorLogButtonLabel count={count} />}
            />
          </>
        )}
      />
    </FormModal>
  );
};
