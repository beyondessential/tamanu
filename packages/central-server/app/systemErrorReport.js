import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getDefaultFromAddress } from './services/mailConfig';

export const systemErrorReport = express.Router();

const schema = yup.object({
  errors: yup
    .array(
      yup.object({
        timestamp: yup.string().required(),
        message: yup.string().required(),
      }),
    )
    .min(1)
    .required(),
  additionalInformation: yup.string(),
  email: yup
    .string()
    .email('Must enter a valid email')
    .nullable(),
  userId: yup.string().required(),
  recipients: yup
    .array(yup.string().email().required())
    .min(1)
    .required(),
});

systemErrorReport.post(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const { body, settings } = req;
    await schema.validate(body);

    const { errors, additionalInformation, email, userId, recipients } = body;

    const emailText = buildEmailText({ errors, additionalInformation, email, userId });

    const result = await req.emailService.sendEmail({
      from: await getDefaultFromAddress(settings),
      to: recipients.join(', '),
      subject: 'Tamanu system error report',
      text: emailText,
    });

    if (result.status !== COMMUNICATION_STATUSES.SENT) {
      log.error(`System error report: could not send email: ${result.error}`);
      throw new Error('Email could not be sent');
    }

    res.send({ ok: 'ok' });
  }),
);

const buildEmailText = ({ errors, additionalInformation, email, userId }) => {
  const errorList = errors
    .map(error => `- [${error.timestamp}] ${error.message}`)
    .join('\n');

  return `
A Tamanu user has submitted a system error report.

Reporting user id: ${userId}
Follow-up email: ${email || '(not provided)'}

Additional information:
${additionalInformation || '(none provided)'}

Error logs:
${errorList}
`;
};
