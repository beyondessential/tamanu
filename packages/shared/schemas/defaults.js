const Default = {
  modifiedFields: {
    type: 'list',
    objectType: 'modifiedField',
  },
  createdBy: 'user',
  createdAt: {
    type: 'date',
    default: new Date(),
  },
  modifiedBy: 'user',
  modifiedAt: {
    type: 'date',
    default: new Date(),
  },
  // whether the object is allowed to be fully synced
  // false - schemas `selector` key would used to sync partial object
  fullySynced: {
    type: 'bool',
    default: false,
  },
};

module.exports = Default;
