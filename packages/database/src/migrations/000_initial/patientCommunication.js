const PATIENT_COMMUNICATION_CHANNELS = {
  EMAIL: 'Email',
  SMS: 'Sms',
  WHATSAPP: 'WhatsApp',
};

const PATIENT_COMMUNICATION_CHANNELS_VALUES = Object.values(PATIENT_COMMUNICATION_CHANNELS);

const PATIENT_COMMUNICATION_TYPES = {
  REFERRAL_CREATED: 'Referral created',
};

const PATIENT_COMMUNICATION_TYPES_VALUES = Object.values(PATIENT_COMMUNICATION_TYPES);

const COMMUNICATION_STATUSES = {
  QUEUED: 'Queued',
  PROCESSED: 'Processed',
  SENT: 'Sent',
  ERROR: 'Error',
  DELIVERED: 'Delivered',
};

const COMMUNICATION_STATUSES_VALUES = Object.values(COMMUNICATION_STATUSES);

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    type: { type: Sequelize.ENUM(PATIENT_COMMUNICATION_TYPES_VALUES), allowNull: false },
    channel: { type: Sequelize.ENUM(PATIENT_COMMUNICATION_CHANNELS_VALUES), allowNull: false },
    subject: Sequelize.TEXT,
    content: Sequelize.TEXT,
    status: {
      type: Sequelize.ENUM(COMMUNICATION_STATUSES_VALUES),
      allowNull: false,
      defaultValue: COMMUNICATION_STATUSES.QUEUED,
    },
    error: Sequelize.TEXT,
    retryCount: Sequelize.INTEGER,
    patientId: foreignKey('Patient'),
  },
});
