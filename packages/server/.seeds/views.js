const bcrypt = require('bcrypt');
const AuthService = require('../app/services/auth');

module.exports = (database) => {
  const views = [
    {
      name: 'patients_admitted',
      filters: "admitted = true"
    },
    {
      name: 'patients_female',
      filters: "sex = 'female'"
    },
    {
      name: 'patients_male',
      filters: "sex = 'male'"
    },
    {
      name: 'medication_completed',
      filters: "status = 'Completed'"
    },
    {
      name: 'medication_requested',
      filters: "status = 'Requested'"
    },
    {
      name: 'medication_fulfilled',
      filters: "status = 'Fulfilled'"
    }
  ];

  views.forEach(view => {
    const { name, filters } = view;
    const viewObject = database.findOne('view', name, 'name');
    if (!viewObject || viewObject.length <= 0) database.create('view', { name, filters: JSON.stringify(filters) }, true);
  });
}