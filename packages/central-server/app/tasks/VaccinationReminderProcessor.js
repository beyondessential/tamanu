import config from 'config';
import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { QueryTypes } from 'sequelize';

export class VaccinationReminderProcessor extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.vaccinationReminderProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    /** @type {import('../ApplicationContext').ApplicationContext} */
    this.context = context;
  }

  getName() {
    return 'VaccinationReminderProcessor';
  }

  async countQueue() {
    return null;
  }

  async run() {
    const transaction = await this.context.store.sequelize.transaction();
    try {
      const timezoneBefore = await this.context.store.sequelize.query('SHOW TIMEZONE;', {
        type: QueryTypes.SELECT,
        plain: true,
        transaction,
      });

      await this.context.store.sequelize.query('SET TIMEZONE TO :timezone', {
        replacements: { timezone: config.globalTimeZone },
        transaction,
      });

      await this.context.store.sequelize.query(
        `
    with
    dayToRemind as (
      select jsonb_array_elements(value)::int "day" from settings where key = 'vaccinationReminder.due'
    ),
    reminders as (
      SELECT
      pc."method" channel,
      pc.patient_id patient_id,
      pc.connection_details->>'chatId' destination,
      hashtext(array_to_string(ARRAY[pc.id,uv.scheduled_vaccine_id,uv.days_till_due::TEXT], '|','')) hash,
      json_build_object(
        'contactName', pc.name ,
        'patientName', array_to_string(array[p.first_name,p.last_name], ' '),
        'vaccineName', rd.name,
        'dueDate', uv.due_date
      ) vars
      FROM upcoming_vaccinations uv
      join patient_contacts pc on pc.patient_id = uv.patient_id and pc.method = :communicationChannel and pc.connection_details->>'chatId' is not null and pc.deleted_at is null
      join scheduled_vaccines sv on sv.id = uv.scheduled_vaccine_id
      join reference_data rd on rd.id = sv.vaccine_id and rd."type" = 'drug'
      join patients p on p.id = uv.patient_id
      where uv.days_till_due in (select "day" from dayToRemind)
    )
    insert into patient_communications (id, created_at, updated_at, channel,  patient_id, destination, hash, status, type, subject, content)
    select
      gen_random_uuid() id,
      NOW() created_at,
      NOW() updated_at,
      r.channel,
      r.patient_id,
      r.destination,
      r.hash,
      :communicationStatus::enum_patient_communications_status status,
      :communicationType type,
      string_translate(:language, :subjectStringId, :subjectFallback, vars) subject,
      string_translate(:language, :contentStringId, :contentFallback, vars) content
      from reminders r
    where r.hash not in (select hash from patient_communications where hash is not null)
    `,
        {
          replacements: {
            communicationChannel: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
            communicationStatus: COMMUNICATION_STATUSES.QUEUED,
            communicationType: PATIENT_COMMUNICATION_TYPES.VACCINATION_REMINDER,
            language: config.language,
            subjectStringId: 'vaccinationReminder.message.subject',
            subjectFallback: 'Vaccination Reminder for :patientName',
            contentStringId: 'vaccinationReminder.message.content',
            contentFallback: 'Your :vaccineName vaccine is scheduled for :dueDate',
          },
          type: QueryTypes.INSERT,
          transaction,
        },
      );

      await this.context.store.sequelize.query('SET TIMEZONE TO :timezone', {
        replacements: { timezone: timezoneBefore['TimeZone'] },
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
