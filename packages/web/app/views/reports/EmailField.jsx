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
        stringId="reportGenerator.form.email.validation.empty"
        fallback="At least 1 email address is required"
      />
    );
  }
  const emailList = parseEmails(emails);

  if (emailList.length === 0) {
    return (
      <TranslatedText
        stringId="reportGenerator.form.email.validation.invalid"
        fallback=":emails is invalid."
        replacements={{ emails }}
      />
    );
  }

  for (let i = 0; i < emailList.length; i++) {
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      return (
        <TranslatedText
          stringId="reportGenerator.form.email.validation.invalid"
          fallback=":emails is invalid."
          replacements={{ emails: emailList[i] }}
        />
      );
    }
  }

  return '';
};

export const EmailField = () => (
  <Field
    name="emails"
    label={
      <TranslatedText
        stringId="reportGenerator.form.email.label"
        fallback="Email to (seperate emails with a comma)"
      />
    }
    component={TextField}
    placeholder="example@example.com"
    multiline
    rows={3}
    validate={validateCommaSeparatedEmails}
    required
  />
);
