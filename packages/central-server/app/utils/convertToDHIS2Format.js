export const convertToDHIS2Format = data => {
  // Dates must be in YYYY-MM-DD format

  // Example valid json for endpoint
  // {
  //   "dataSet": "dataSetID",
  //   "completeDate": "date",
  //   "period": "period",
  //   "orgUnit": "orgUnitID",
  //   "attributeOptionCombo": "aocID",
  //   "dataValues": [
  //     {
  //       "dataElement": "dataElementID",
  //       "categoryOptionCombo": "cocID",
  //       "value": "1",
  //       "comment": "comment1"
  //     },
  //     {
  //       "dataElement": "dataElementID",
  //       "categoryOptionCombo": "cocID",
  //       "value": "2",
  //       "comment": "comment2"
  //     },
  //     {
  //       "dataElement": "dataElementID",
  //       "categoryOptionCombo": "cocID",
  //       "value": "3",
  //       "comment": "comment3"
  //     }
  //   ]
  // }

  return data;
};
