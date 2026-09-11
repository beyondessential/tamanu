import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { AuthPermissionError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { ReadSettings } from '@tamanu/settings';
import { getDefaultFromAddress } from './services/mailConfig';

// spec: SYSERR#sending-a-report-to-support
export const systemErrorReport = express.Router();

// Unlike facility-server, central-server doesn't apply this globally — routes mounted
// directly on buildRoutes() need it themselves to use req.flagPermissionChecked().
systemErrorReport.use(ensurePermissionCheck);

const schema = yup.object({
  errors: yup
    .array(
      yup.object({
        timestamp: yup.string().required(),
        message: yup.string().max(1000).required(),
      }),
    )
    .min(1)
    .max(500)
    .required(),
  additionalInformation: yup.string().max(5000),
  email: yup
    .string()
    .email('Must enter a valid email')
    .nullable(),
  userId: yup.string().required(),
  facilityId: yup.string().required(),
});

systemErrorReport.post(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const { body, settings, models, user } = req;
    await schema.validate(body);

    const { errors, additionalInformation, email, userId, facilityId } = body;

    const userInstance = await models.User.findByPk(user.id);
    const hasAccess = await userInstance.canAccessFacility(facilityId);
    if (!hasAccess) {
      throw new AuthPermissionError('User does not have access to this facility');
    }

    const { recipients } = await new ReadSettings(models, facilityId).get('systemErrorReport');

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
