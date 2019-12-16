import express from 'express';
import moment from 'moment';

import { objectToJSON } from '../../utils';
import { fillDateRange } from 'Shared/utils/fillDateRange';

export const reportsRoutes = express.Router();

reportsRoutes.get('/diagnosesByWeek', (req, res) => {
  const { db, query } = req;
  const { 
    startDate = '', 
    endDate = '',
    diagnoses = '',
  } = query;

  const ranges = fillDateRange(startDate, endDate, 'week');
  const columns = ranges.map(x => x.format('DD/MM/YYYY'));

  const results = diagnoses.split(',').map(_id => {
    const diagnosis = db.objectForPrimaryKey('diagnosis', _id);
    const diagnoses = db.objects('patientDiagnosis')
      .filtered('diagnosis._id = $0', _id);

    const countForDates = (start, end) => diagnoses
      .map(diagnosis => moment(diagnosis.date))
      .filter(date => date >= start && date <= end)
      .length;

    return {
      key: _id,
      formatted: diagnosis.name,
      values: ranges.map(r => countForDates(r, moment(r).add(1, 'week'))),
    }
  });

  const meta = {
    title: "Diagnosis",
    columns,
  };

  res.send({ results, meta });
});
