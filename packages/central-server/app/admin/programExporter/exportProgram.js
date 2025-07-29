import { QueryTypes } from 'sequelize';
import { writeExcelFile } from '../../utils/excelUtils';
import { groupBy } from 'lodash';

export async function exportProgram(context, programId) {
  const { models, sequelize } = context;
  const program = await models.Program.findOne({
    where: {
      id: programId,
    },
    plain: true,
    raw: true,
  });
  if (!program) {
    throw new Error(`Program with id ${programId} not found`);
  }

  const sheets = [];

  const surveys = await models.Survey.findAll({
    where: { programId: program.id },
  });

  const namePattern = /\((.*?)\)\s*(.*)/;
  const match = program.name.match(namePattern);
  const country = match?.[1] ?? '';
  const programName = match?.[2] ?? program.name;
  const programCode = program.id.replace('program-', '');

  const metadataSheet = {
    name: 'Metadata',
    data: [
      ['programName', programName],
      ['programCode', programCode],
      ['country', country],
      ['homeServer', country ? 'true' : ''],
      [],
      [
        'code',
        'name',
        'surveyType',
        'targetLocationId',
        'targetDepartmentId',
        'status',
        'isSensitive',
        'visibilityStatus',
        'notifiable',
        'notifyEmailAddresses',
      ],
      ...surveys.map(survey => [
        survey.code,
        survey.name.replace(`(${country}) `, ''),
        survey.surveyType,
        '',
        '',
        'publish',
        survey.isSensitive,
        survey.visibilityStatus,
        survey.notifiable,
        survey.notifyEmailAddresses.join(','),
      ]),
    ],
  };

  sheets.push(metadataSheet);

  let surveySheets = [];
  if (surveys.length) {
    const surveyRecords = await sequelize.query(
      `
      SELECT
        ssc.id,
        ssc.detail,
        ssc.visibility_criteria,
        ssc.validation_criteria,
        ssc.calculation,
        ssc.config,
        ssc.visibility_status,
        ssc.screen_index,
        ssc.component_index,
        ssc.survey_id,
        pde.code,
        pde.type,
        pde.name,
        pde.default_text as text,
        pde.default_options as options,
        pde.visualisation_config
      FROM survey_screen_components ssc
      JOIN program_data_elements pde ON ssc.data_element_id = pde.id
      WHERE ssc.survey_id IN (:surveyIds)
      ORDER BY ssc.screen_index, ssc.component_index
    `,
      {
        replacements: { surveyIds: surveys.map(({ id }) => id) },
        type: QueryTypes.SELECT,
      },
    );

    const groupedSurveyRecords = groupBy(surveyRecords, 'survey_id');
    surveySheets = surveys.map(survey => ({
      name: survey.code,
      data: [
        [
          'code',
          'type',
          'name',
          'text',
          'detail',
          'newScreen',
          'options',
          'optionLabels',
          'optionColors',
          'visibilityCriteria',
          'validationCriteria',
          'visualisationConfig',
          'optionSet',
          'questionLabel',
          'detailLabel',
          'calculation',
          'config',
          'visibilityStatus',
        ],
        ...(groupedSurveyRecords[survey.id] || []).map((s, i, a) => [
          s.code,
          s.type,
          s.name,
          s.text,
          s.detail,
          a[i - 1] && s.screen_index !== a[i - 1].screen_index ? 'yes' : '',
          s.options,
          '',
          '',
          s.visibility_criteria,
          s.validation_criteria,
          s.visualisation_config,
          '',
          '',
          '',
          s.calculation,
          s.config,
          s.visibility_status,
        ]),
      ],
    }));
  }

  sheets.push(...surveySheets);

  const programRegistry = await models.ProgramRegistry.findOne({
    where: {
      programId: program.id,
    },
    raw: true,
    plain: true,
  });

  const registrySheet = {
    name: 'Registry',
    data: [
      ['registryName', programRegistry?.name],
      ['registryCode', programRegistry?.code],
      ['visibilityStatus', programRegistry?.visibilityStatus],
      ['currentlyAtType', programRegistry?.currentlyAtType],
      [],
      ['code', 'name', 'color', 'visibilityStatus'],
    ],
  };

  if (programRegistry) {
    const programRegistryClinicalStatuses = await models.ProgramRegistryClinicalStatus.findAll({
      where: { programRegistryId: programRegistry.id },
    });

    registrySheet.data.push(
      ...programRegistryClinicalStatuses.map(status => [
        status.code,
        status.name,
        status.color,
        status.visibilityStatus,
      ]),
    );
    sheets.push(registrySheet);
  }

  if (programRegistry) {
    const programRegistryConditions = await models.ProgramRegistryCondition.findAll({
      where: { programRegistryId: programRegistry.id },
    });
    const programRegistryConditionCategories = await models.ProgramRegistryConditionCategory.findAll({
      where: { programRegistryId: programRegistry.id },
    });

    const registryConditionsSheet = {
      name: 'Registry Conditions',
      data: [
        ['code', 'name', 'visibilityStatus'],
        ...programRegistryConditions.map(condition => [
          condition.code,
          condition.name,
          condition.visibilityStatus,
        ]),
      ],
    };

    const registryConditionCategoriesSheet = {
      name: 'Registry Condition Categories',
      data: [
        ['code', 'name', 'visibilityStatus'],
        ...programRegistryConditionCategories.map(category => [
          category.code,
          category.name,
          category.visibilityStatus,
        ]),
      ],
    };

    sheets.push(registryConditionsSheet);
    sheets.push(registryConditionCategoriesSheet);
  }

  const exportedFileName = writeExcelFile(sheets);

  return exportedFileName;
}
