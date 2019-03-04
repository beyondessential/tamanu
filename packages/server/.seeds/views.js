module.exports = (database) => {
  const views = [
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

  database.write(() => {
    views.forEach(view => {
      const { name, filters } = view;
      const viewObject = database.findOne('view', name, 'name');
      if (!viewObject || viewObject.length <= 0) database.create('view', { name, filters: JSON.stringify(filters) }, true);
    });
  });
}
