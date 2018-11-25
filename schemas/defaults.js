const Default = {
  modifiedFields: 'string?',
  createdAt: {
    type: 'date',
    default: new Date()
  },
  modifiedAt: {
    type: 'date',
    default: new Date()
  }
};

module.exports = Default;
