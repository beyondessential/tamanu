const Default = {
  modifiedFields: 'string?',
  createdAt: {
    type: 'date',
    default: new Date()
  },
  modifiedAt: {
    type: 'date',
    default: new Date()
  },
  fullySynced: {
    type: 'bool',
    default: false
  }
};

module.exports = Default;
