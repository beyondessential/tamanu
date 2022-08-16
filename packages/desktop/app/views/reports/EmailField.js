import React from 'react';
import * as Yup from 'yup';
import { Field, TextField } from '../../components';

export const parseEmails = commaSeparatedEmails =>
  commaSeparatedEmails
    .split(/[;,]/)
    .map(email => email.trim())
    .filter(email => email);

const emailSchema = Yup.string().email();

const validateCommaSeparatedEmails = async emails => {
  if (!emails) {
    return 'At least 1 email address is required';
  }
  const emailList = parseEmails(emails);

  if (emailList.length === 0) {
    return `${emails} is invalid.`;
  }

  for (let i = 0; i < emailList.length; i++) {
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      return `${emailList[i]} is invalid.`;
    }
  }

  return '';
};

export const EmailField = () => (
  <Field
    name="emails"
    label="Email to (separate emails with a comma)"
    component={TextField}
    placeholder="example@example.com"
    multiline
    rows={3}
    validate={validateCommaSeparatedEmails}
    required
  />
);
