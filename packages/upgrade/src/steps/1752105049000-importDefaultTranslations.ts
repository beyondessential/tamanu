import { QueryTypes } from 'sequelize';
import { uniqBy } from 'lodash';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { END, type Steps, type StepArgs } from '../step.js';
import {
  DEFAULT_LANGUAGE_CODE,
  ENGLISH_LANGUAGE_CODE,
  COUNTRY_CODE_STRING_ID,
  LANGUAGE_NAME_STRING_ID,
  ENGLISH_COUNTRY_CODE,
  ENGLISH_LANGUAGE_NAME,
} from '@tamanu/constants';
import { getMetaServerHosts } from '@tamanu/shared/utils';

interface Artifact {
  artifact_type: string;
  download_url: string;
}

interface Translation {
  stringId: string;
  [DEFAULT_LANGUAGE_CODE]?: string;
  [ENGLISH_LANGUAGE_CODE]?: string;
  fallback?: string; // legacy
}

async function download(
  metaServerHost: string,
  artifactType: string,
  extractor: (resp: Response) => Promise<Translation[]>,
  { toVersion, log }: StepArgs,
): Promise<Translation[]> {
  const url = `${metaServerHost}/versions/${toVersion}/artifacts`;
  log.info('Downloading translation artifacts', { version: toVersion, url });

  const artifactsResponse = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!artifactsResponse.ok) {
    throw new Error(
      `Failed to fetch artifacts list: ${artifactsResponse.status} ${artifactsResponse.statusText}`,
    );
  }

  const artifacts = (await artifactsResponse.json()) as unknown as Artifact[];
  const translationsArtifact = artifacts.find(artifact => artifact.artifact_type === artifactType);
  if (!translationsArtifact) {
    throw new Error(`No ${artifactType} artifact found for version ${toVersion}`);
  }

  log.info(`Downloading ${artifactType} artifact`, {
    url: translationsArtifact.download_url,
  });
  const translationsResponse = await fetch(translationsArtifact.download_url);
  if (!translationsResponse.ok) {
    throw new Error(
      `Failed to download ${artifactType} artifact: ${translationsResponse.status} ${translationsResponse.statusText}`,
    );
  }

  return await extractor(translationsResponse);
}

// Tries each meta server in the array until one succeeds
// Returns the translations or throws an error if all fail
async function downloadFromMetaServerHosts(
  artifactType: string,
  extractor: (resp: Response) => Promise<Translation[]>,
  stepArgs: StepArgs,
): Promise<Translation[]> {
  const metaServerHosts = getMetaServerHosts();

  const { log } = stepArgs;
  for (const metaServerHost of metaServerHosts) {
    try {
      const rows = await download(metaServerHost, artifactType, extractor, stepArgs);
      return rows;
    } catch (error) {
      log.error(`Failed to download from meta server host: ${metaServerHost}`, { error });
    }
  }
  throw new Error('No meta server succeeded downloading the artifacts');
}

async function apply(artifactType: string, rows: Translation[], { models, log }: StepArgs) {
  if (rows.length === 0) {
    throw new Error('No valid translation rows found');
  }

  log.info(`Importing ${artifactType}`, { count: rows.length });

  if (rows.length > 0) {
    await models.TranslatedString.sequelize.query(
      `
          INSERT INTO translated_strings (string_id, text, language)
          VALUES ${rows.map(() => `(?, ?, '${DEFAULT_LANGUAGE_CODE}')`).join(', ')}
          ON CONFLICT (string_id, language) DO UPDATE SET text = EXCLUDED.text
        `,
      {
        replacements: rows.flatMap(row => {
          const text = row[DEFAULT_LANGUAGE_CODE] ?? row[ENGLISH_LANGUAGE_CODE] ?? row.fallback;
          return text ? [row.stringId, text] : [];
        }),
        type: QueryTypes.INSERT,
      },
    );
  }
}

async function xlsxExtractor(resp: Response): Promise<Translation[]> {
  const data = await resp.arrayBuffer();
  const workbook = xlsx.read(data, { type: 'buffer' });
  const sheet = Object.values(workbook.Sheets)[0];
  if (!sheet) {
    throw new Error('No sheet found in the XLSX file');
  }

  const rows: Translation[] = xlsx.utils.sheet_to_json(sheet);
  return uniqBy(rows, item => item.stringId);
}

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType }: StepArgs) {
      // Only run on central server
      return serverType === 'central';
    },
    async run(args: StepArgs) {
      const zeroPatch = args.toVersion.replace(/\.(\d+)$/, '.0');

      try {
        const updateDistCjsIndexJsPath = require.resolve('@tamanu/upgrade');

        const defaultTranslationsPath = path.join(
          updateDistCjsIndexJsPath,
          '..', // cjs
          '..', // dist
          'default-translations.json',
        );

        args.log.info(`Loading default all translations from: ${defaultTranslationsPath}`);

        const translationRows = JSON.parse(fs.readFileSync(defaultTranslationsPath, 'utf8'));

        // Add default language name and country code
        translationRows.unshift({
          stringId: LANGUAGE_NAME_STRING_ID,
          [DEFAULT_LANGUAGE_CODE]: ENGLISH_LANGUAGE_NAME,
        });
        translationRows.unshift({
          stringId: COUNTRY_CODE_STRING_ID,
          [DEFAULT_LANGUAGE_CODE]: ENGLISH_COUNTRY_CODE,
        });

        args.log.info('Importing new default translations', { count: translationRows.length });

        if (translationRows.length > 0) {
          await apply('translations', translationRows, args);

          // Set english language name and country code to default if not present
          const englishLanguageName = await args.models.TranslatedString.findOne({
            where: { stringId: LANGUAGE_NAME_STRING_ID, language: ENGLISH_LANGUAGE_CODE },
            paranoid: false, // Don't insert if the user has already soft deleted it
          });
          if (!englishLanguageName) {
            await args.models.TranslatedString.create({
              stringId: LANGUAGE_NAME_STRING_ID,
              language: ENGLISH_LANGUAGE_CODE,
              text: ENGLISH_LANGUAGE_NAME,
            });
          }
          const englishCountryCode = await args.models.TranslatedString.findOne({
            where: { stringId: COUNTRY_CODE_STRING_ID, language: ENGLISH_LANGUAGE_CODE },
            paranoid: false, // Don't insert if the user has already soft deleted it
          });
          if (!englishCountryCode) {
            await args.models.TranslatedString.create({
              stringId: COUNTRY_CODE_STRING_ID,
              language: ENGLISH_LANGUAGE_CODE,
              text: ENGLISH_COUNTRY_CODE,
            });
          }

          args.log.info('Successfully imported default translations');
        }
      } catch (error) {
        args.log.error(
          'Failed to import default translations, you will need to manually import them',
          { error },
        );
      }

      try {
        const rows = await downloadFromMetaServerHosts('report-translations', xlsxExtractor, {
          ...args,
          toVersion: zeroPatch,
        });
        await apply('report-translations', rows, { ...args, toVersion: zeroPatch });
        args.log.info('Successfully imported default report translations');
      } catch (error) {
        args.log.error(
          'Failed to import default report translations, you will need to manually import them',
          {
            error,
          },
        );
      }
    },
  },
];
