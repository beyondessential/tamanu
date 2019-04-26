import defaults from './defaults';

export const PregnancySchema = {
  name: 'pregnancy',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    conceiveDate: {
      type: 'date',
      optional: true,
      indexed: true,
    }, // estimated
    deliveryDate: {
      type: 'date',
      optional: true,
      indexed: true,
    }, // estimated
    child: {
      type: 'patient',
      optional: true,
    },
    father: {
      type: 'patient',
      optional: true,
    }, // biological father
    outcome: {
      type: 'string',
      optional: true,
    },
    gestationalAge: {
      type: 'string',
      optional: true,
    },
    surveyResponses: {
      type: 'list',
      objectType: 'surveyResponse',
    },
    ...defaults,
  },
};
