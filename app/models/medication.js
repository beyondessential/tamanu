const Backbone = require('backbone-associations');
const shortid = require('shortid');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `medication_${_id}`,
      docType: 'medication',
      drug: '',
      notes: '',
      prescription: '',
      prescriptionDate: '',
      quantity: '',
      refills: '',
      requestedDate: '',
      requestedBy: '',
      status: '',
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'drug',
      relatedModel: () => require('./drug'),
      map: (values) => mapRelations(values, require('./drug')),
      serialize: '_id'
    },
  ],

  validate: (attrs) => {
    if (attrs.drugName === '') return 'Medication is required!';
    if (attrs.prescription === '') return 'Prescription is required!';
    if (attrs.prescriptionDate === '') return 'Prescription Date is required!';
  }
});
