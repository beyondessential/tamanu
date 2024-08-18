import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';

export class SurveyCompletionNotifierProcessor extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.surveyCompletionNotifierProcessor ?? {
      enabled: true,
      // every 30seconds /!\
      schedule: '*/30 * * * * *',
      limit: 100,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    /** @type {import('../ApplicationContext').ApplicationContext} */
    this.context = context;
  }

  getName() {
    return 'SurveyCompletionNotifierProcessor';
  }

  async countQueue() {
    return null;
  }

  async run() {
    const surveyResponses = await this.context.store.models.SurveyResponse.findAll({
      limit: this.config.limit ?? 100,
      where: {
        endTime: { [Op.not]: null },
        notified: false,
      },
      include: [
        {
          model: this.context.store.models.Encounter,
          as: 'encounter',
          include: [
            {
              model: this.context.store.models.Patient,
              as: 'patient',
            },
          ],
        },
        {
          model: this.context.store.models.Survey,
          as: 'survey',
          where: {
            notifiable: true,
            notifyEmailAddresses: { [Op.ne]: [] },
          },
        },
      ],
    });
    const getTranslation = await this.context.store.models.TranslatedString?.getTranslationFunction(
      config.language,
      ['surveyCompletionNotifier'],
    );
    for (const surveyResponse of surveyResponses) {
      await this.context.emailService
        .sendEmail({
          to: surveyResponse.survey.notifyEmailAddresses,
          subject: getTranslation(
            'surveyCompletionNotifier.emailSubject',
            `Notification of :surveyName form submission in Tamanu`,
            { surveyName: surveyResponse.survey.name },
          ),
          body: getTranslation(
            'surveyCompletionNotifier.emailBody',
            `A form has been submitted in Tamanu that may require your attention! This is an automated email to notify you that a response to a form has been submitted in Tamanu. Please login to Tamanu desktop to view details of this form response. Do not respond to this email. <br />
            Form: :surveyName<br />
            Date/Time: :endTime<br />
            Patient: :patientDisplayId<br />`,
            {
              surveyName: surveyResponse.survey.name,
              endTime: surveyResponse.endTime,
              patientDisplayId: surveyResponse.encounter.patient.displayId,
            },
          ),
        })
        .catch(error => {
          log.error('Failed to send email notification', { error });
        });
      surveyResponse.notified = true;
      await surveyResponse.save();
    }
  }
}
