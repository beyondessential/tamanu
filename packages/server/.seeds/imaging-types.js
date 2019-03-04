module.exports = (database) => {
  const imagingTypes = [
    {
      _id: 'imaging-type-x-ray',
      name: 'X-Ray',
      sortOrder: 0,
    }, {
      _id: 'imaging-type-ultrasound',
      name: 'Ultrasound',
      sortOrder: 1,
    }, {
      _id: 'imaging-type-ct',
      name: 'CT',
      sortOrder: 2,
    }, {
      _id: 'imaging-type-mri',
      name: 'MRI',
      sortOrder: 3,
    }, {
      _id: 'imaging-type-cm-x-ray',
      name: 'Contrast Media X-Ray',
      sortOrder: 4,
    }, {
      _id: 'imaging-type-cm-ultrasound',
      name: 'Contrast Media Ultrasound',
      sortOrder: 5,
    },
  ];

  imagingTypes.forEach(imagingType => database.create('imagingType', imagingType, true));
}
