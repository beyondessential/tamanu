import config from 'config';
import { writeExcelFile } from '../exporter/excelUtils';

export async function exportProgram(context, programId) {
  const { models } = context;
  const program = await models.Program.findOne({
    where: {
      id: programId,
    },
    plain: true,
    raw: true,
  });

  const surveys = await models.Survey.findAll({
    where: { programId: program.id },
  });

  const namePattern = /\((.*?)\)\s*(.*)/;
  const match = program.name.match(namePattern);
  const country = match?.[1] ?? '';
  const programName = match?.[2] ?? program.name;

  const metadataSheet = {
    name: 'Metadata',
    data: [
      ['programName', programName],
      ['programCode', program.id.replace('program-', '')],
      ['country', country],
      ['homeServer', ''],
      [],
      ['code', 'name', 'surveyType', 'isSensitive'],
      ...surveys.map(survey => [
        survey.code,
        survey.name.replace(`(${country}) `, ''),
        survey.surveyType,
        survey.isSensitive,
      ]),
    ],
  };

  const programRegistry = await models.ProgramRegistry.findOne({
    where: {
      programId: program.id,
    },
    raw: true,
    plain: true,
  });

  const programRegistryClinicalStatuses = await models.ProgramRegistryClinicalStatus.findAll({
    where: { programRegistryId: programRegistry.id },
  });

  const registrySheet = {
    name: 'Registry',
    data: [
      ['registryName', programRegistry.name],
      ['registryCode', programRegistry.code],
      ['visibilityStatus', programRegistry.visibilityStatus],
      ['currentlyAtType', programRegistry.currentlyAtType],
      [],
      ['code', 'name', 'color', 'visibilityStatus'],
      ...programRegistryClinicalStatuses.map(status => [
        status.code,
        status.name,
        status.color,
        status.visibilityStatus,
      ]),
    ],
  };

  const programRegistryConditions = await models.ProgramRegistryCondition.findAll({
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

  const surveySheets = [];
  await Promise.all(surveys.map(async survey => {
    const surveyScreenComponents = await models.SurveyScreenComponent.findAll({
      where: { surveyId: survey.id },
    });

    const data = await Promise.all(
      surveyScreenComponents.map(async it => {
        const code = it.id.replace(`${survey.id}-`, '');
        const programDataElement = await models.ProgramDataElement.findOne({
          where: { code },
          plain: true,
          raw: true,
        });
        return [
          code,
          programDataElement.type,
          programDataElement.name,
          programDataElement.defaultText,
          it.detail,
          '',
          programDataElement.options,
          '',
          it.visibilityCriteria,
          it.validationCriteria,
          '',
          '',
          '',
          it.calculation,
          it.config,
        ];
      }),
    );

    surveySheets.push({
      name: survey.name.replace(`(${country}) `, ''),
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
          'visibilityCriteria',
          'validationCriteria',
          'optionSet',
          'questionLabel',
          'detailLabel',
          'calculation',
          'config',
        ],
        ...data,
      ],
    });
  }));

  const exportedFileName = writeExcelFile(
    [metadataSheet, ...surveySheets, registrySheet, registryConditionsSheet],
    '',
  );

  // This is a temporary fix for limiting the exported file size.
  // TODO: Remove this validation as soon as we implement the download in chunks.
  const { maxFileSizeInMB } = config.export;
  // await validateFileSize(exportedFileName, maxFileSizeInMB);
  return exportedFileName;
}
