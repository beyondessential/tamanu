import { QueryTypes } from 'sequelize';
import { writeExcelFile } from '../../utils/excelUtils';

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
      ]),
    ],
  };

  sheets.push(metadataSheet);

  const surveySheets = [];
  await Promise.all(
    surveys.map(async survey => {
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
          pde.code,
          pde.type,
          pde.name,
          pde.default_text "text",
          pde.default_options options
        FROM survey_screen_components ssc
        JOIN program_data_elements pde ON concat(:surveyId, '-', pde.code) = ssc.id
        WHERE ssc.survey_id = :surveyId
      `,
        {
          replacements: { surveyId: survey.id },
          type: QueryTypes.SELECT,
        },
      );

      surveySheets.push({
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
            'optionSet',
            'questionLabel',
            'detailLabel',
            'calculation',
            'config',
            'visibilityStatus',
          ],
          ...surveyRecords.map(it => [
            it.code,
            it.type,
            it.name,
            it.text,
            it.detail,
            '',
            it.options,
            '',
            '',
            it.visibility_criteria,
            it.validation_criteria,
            '',
            '',
            '',
            it.calculation,
            it.config,
            it.visibility_status,
          ]),
        ],
      });
    }),
  );

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

  const registryConditionsSheet = {
    name: 'Registry Conditions',
    data: [['code', 'name', 'visibilityStatus']],
  };
  if (programRegistry) {
    const programRegistryConditions = await models.ProgramRegistryCondition.findAll({
      where: { programRegistryId: programRegistry.id },
    });

    registryConditionsSheet.data.push(
      ...programRegistryConditions.map(condition => [
        condition.code,
        condition.name,
        condition.visibilityStatus,
      ]),
    );
    sheets.push(registryConditionsSheet);
  }

  const exportedFileName = writeExcelFile(sheets);

  return exportedFileName;
}
