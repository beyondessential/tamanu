import React from 'react';
import { connectApi } from '../../api';

import { Suggester } from '../../utils/suggester';
import { ReportGeneratorForm } from '../../forms/ReportGeneratorForm';
import { BaseReport } from './BaseReport';

export const VillageDiagnosesByWeekReport = ({ icd10Suggester, onRunQuery }) => (
  <BaseReport
    FilterForm={props => <ReportGeneratorForm icd10Suggester={icd10Suggester} {...props} />}
    onRunQuery={onRunQuery}
  />
);

export const ConnectedVillageDiagnosesByWeekReport = connectApi(api => ({
  icd10Suggester: new Suggester(api, 'icd10'),
  onRunQuery: async data => {
    const diagnoses = data.diagnoses.map(x => x._id).join(',');
    return api.get('reports/diagnosesByWeek', { ...data, diagnoses });
  },
}))(VillageDiagnosesByWeekReport);
