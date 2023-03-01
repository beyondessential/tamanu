import { subDays, startOfDay } from 'date-fns';
import { Op } from 'sequelize';

import { LAB_REQUEST_STATUSES } from 'shared/constants';

export const getCovidClearanceCertificateFilter = async models => {
  const {
    after = '2022-09-01',
    daysSinceSampleTime = 13,
    labTestCategories = [],
    labTestTypes = [],
    labTestResults = ['Positive'],
  } = await models.Setting.get('covidClearanceCertificate');

  const labRequestsWhere = {
    status: LAB_REQUEST_STATUSES.PUBLISHED,
  };

  labRequestsWhere.sampleTime = {
    [Op.lt]: subDays(startOfDay(new Date()), daysSinceSampleTime),
    [Op.gt]: after,
    '$tests.result$': {
      [Op.in]: labTestResults,
    }
  };

  if (labTestCategories.length) {
    labRequestsWhere.labTestCategoryId = {
      [Op.in]: labTestCategories,
    };
  }

  if (labTestTypes.length) {
    labRequestsWhere['$tests.lab_test_type_id$'] = {
      [Op.in]: labTestTypes,
    };
  }

  return labRequestsWhere;
};
