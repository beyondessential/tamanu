import { Sequelize, Op } from 'sequelize';
import { generateReportFromQueryData } from './utilities';

const parametersToSqlWhere = parameters => {
  if (!parameters || !Object.keys(parameters).length) {
    return undefined;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        const newWhere = { ...where };
        switch (key) {
          case 'fromDate':
            newWhere.createdAt[Op.gte] = value;
            break;
          case 'toDate':
            newWhere.createdAt[Op.lte] = value;
            break;
          default:
            break;
        }
        return newWhere;
      },
      { createdAt: {} },
    );

  return whereClause;
};

export const permission = 'Patient';

export const dataGenerator = async (models, parameters = {}) => {
  const reportColumnTemplate = [
    { title: 'Date registered', accessor: data => data.dateCreated },
    { title: 'Registered by', accessor: data => data.registeredBy },
    { title: 'First name', accessor: data => data.first_name },
    { title: 'Middle name', accessor: data => data.middle_name },
    { title: 'Last name', accessor: data => data.last_name },
    { title: 'Cultural name', accessor: data => data.cultural_name },
    { title: 'MRID', accessor: data => data.display_id },
    { title: 'Sex', accessor: data => data.sex },
    { title: 'Village', accessor: data => data.villageName },
    { title: 'Date of birth', accessor: data => data.dateOfBirth },
    { title: 'Birth certificate number', accessor: data => data.birthCertificate },
    { title: 'Driving license number', accessor: data => data.drivingLicense },
    { title: 'Passport number', accessor: data => data.passport },
    { title: 'Blood type', accessor: data => data.bloodType },
    { title: 'Title', accessor: data => data.title },
    { title: 'Marital Status', accessor: data => data.maritalStatus },
    { title: 'Primary contact number', accessor: data => data.primaryContactNumber },
    { title: 'Secondary contact number', accessor: data => data.secondaryContactNumber },
    { title: 'Country', accessor: data => data.countryName },
    { title: 'Nationality', accessor: data => data.nationalityName },
    { title: 'Tribe', accessor: data => data.ethnicityName },
    { title: 'Occupation', accessor: data => data.occupationName },
    { title: 'Religion', accessor: data => data.religionName },
    { title: 'Patient type', accessor: data => data.patientBillingTypeName },
  ];

  const whereClause = parametersToSqlWhere(parameters);
  const patientsData = await models.Patient.findAll({
    attributes: [
      [Sequelize.literal(`DATE("Patient".created_at)`), 'dateCreated'],
      [Sequelize.literal(`DATE("date_of_birth")`), 'dateOfBirth'],
      'first_name',
      'middle_name',
      'last_name',
      'cultural_name',
      'display_id',
      'sex',
    ],
    include: [
      {
        model: models.ReferenceData,
        attributes: ['name'],
        as: 'village',
      },
      {
        model: models.PatientAdditionalData,
        include: [
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'country',
          },
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'nationality',
          },
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'ethnicity',
          },
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'occupation',
          },
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'religion',
          },
          {
            model: models.ReferenceData,
            attributes: ['name'],
            as: 'patientBillingType',
          },
        ],
      },
    ],
    where: whereClause,
    order: [[Sequelize.literal(`"dateCreated"`), 'ASC']],
  });

  const reportData = patientsData.map(({ dataValues }) => {
    const villageName = dataValues.village?.dataValues?.name ?? null;

    const additionalData = dataValues.PatientAdditionalData[0]?.dataValues ?? null;
    const countryName = additionalData?.country?.dataValues?.name ?? null;
    const nationalityName = additionalData?.nationality?.dataValues?.name ?? null;
    const ethnicityName = additionalData?.ethnicity?.dataValues?.name ?? null;
    const occupationName = additionalData?.occupation?.dataValues?.name ?? null;
    const religionName = additionalData?.religion?.dataValues?.name ?? null;
    const patientBillingTypeName = additionalData?.patientBillingType?.dataValues?.name ?? null;

    return {
      ...dataValues,
      ...additionalData,
      villageName,
      countryName,
      nationalityName,
      ethnicityName,
      occupationName,
      religionName,
      patientBillingTypeName,
    };
  });

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};
