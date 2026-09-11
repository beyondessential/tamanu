import React from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';
import { Divider } from '@material-ui/core';
import {
  Form,
  FormGrid,
  FormSubmitCancelRow,
  FullWidthRow,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';

import { BodyText, FormModal } from '../../components';
import { Field } from '../../components/Field';
import { useApi } from '../../api';
import { useTranslation } from '../../contexts/Translation';
import { notifyError, notifySuccess } from '../../utils';

const StyledDivider = styled(Divider)`
  margin: 20px 0;
`;

const ActionRowDivider = styled(Divider)`
  margin: 40px 0 30px;
`;

const EmphasisedCount = styled.span`
  font-weight: 700;
  text-decoration: underline;
`;

const ReportingSubtitleText = styled(BodyText)`
  font-size: 16px;
  font-weight: 500;
  margin-top: 26px;
`;

export const SendErrorLogButtonLabel = ({ count }) =>
  count === 1 ? (
    <TranslatedText stringId="systemErrors.action.sendErrorLog.singular" fallback="Send error log" />
  ) : (
    <TranslatedText stringId="systemErrors.action.sendErrorLog.plural" fallback="Send error logs" />
  );

const ReportingSubtitle = ({ count }) => (
  <ReportingSubtitleText color="textSecondary" data-testid="send-error-log-subtitle">
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
  </ReportingSubtitleText>
);

export const SendErrorLogModal = ({ open, onClose, errors, onSentSuccessfully }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const count = errors.length;

  const handleSubmit = async values => {
    try {
      await api.post('systemErrorReport', { ...values, errors });
    } catch (error) {
      notifyError(
        <TranslatedText
          stringId="systemErrors.modal.error"
          fallback="Failed to submit. Please try again later."
        />,
      );
      return;
    }

    onSentSuccessfully(errors);
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
    <FormModal
      open={open}
      onClose={onClose}
      title={<SendErrorLogButtonLabel count={count} />}
      width="md"
    >
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
                minRows={3}
              />
            </FormGrid>
            <StyledDivider />
            <BodyText color="textSecondary" mb={1}>
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
            <FullWidthRow data-testid="fullwidthrow-send-error-log">
              <ActionRowDivider />
            </FullWidthRow>
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
