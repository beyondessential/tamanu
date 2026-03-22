import React from 'react';
import * as Yup from 'yup';
import { Field, TextField } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const parseEmails = commaSeparatedEmails =>
  commaSeparatedEmails
    .split(/[;,]/)
    .map(email => email.trim())
    .filter(email => email);

const emailSchema = Yup.string().email();

const validateCommaSeparatedEmails = async emails => {
  if (!emails) {
    return (
      <TranslatedText
        stringId="report.generate.email.validation.atLeastOneRequired"
        fallback="At least 1 email address is required"
        data-testid="translatedtext-d30q"
      />
    );
  }
  const emailList = parseEmails(emails);

  if (emailList.length === 0) {
    return (
      <TranslatedText
        stringId="report.generate.email.validation.invalid"
        fallback=":email is invalid."
        replacements={{ email: emails }}
        data-testid="translatedtext-2eas"
      />
    );
  }

  for (let i = 0; i < emailList.length; i++) {
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      return (
        <TranslatedText
          stringId="report.generate.email.validation.invalid"
          fallback=":email is invalid."
          replacements={{ email: emailList[i] }}
          data-testid="translatedtext-icj6"
        />
      );
    }
  }

  return '';
};

export const EmailField = (props = {}) => (
  <Field
    name="emails"
    label={
      <TranslatedText
        stringId="report.generate.emailList.label"
        fallback="Email to (separate emails with a comma)"
        data-testid="translatedtext-a13h"
      />
    }
    component={TextField}
    placeholder="example@example.com"
    multiline
    minRows={3}
    validate={validateCommaSeparatedEmails}
    required
    {...props}
    data-testid="field-n61m"
  />
);
