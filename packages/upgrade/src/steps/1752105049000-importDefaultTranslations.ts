import config from 'config';
import { QueryTypes } from 'sequelize';
import { uniqBy } from 'lodash';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { END, type Steps, type StepArgs } from '../step.js';
import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

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
  artifactType: string,
  extractor: (resp: Response) => Promise<Translation[]>,
  { toVersion, log }: StepArgs,
): Promise<Translation[]> {
  const url = `${(config as any).metaServer!.host!}/versions/${toVersion}/artifacts`;
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
        const defaultTranslationsPath = path.join(
          __dirname, // scripts
          '..', // src
          '..', // upgrade
          'dist',
          'default-translations.json',
        );

        args.log.info(`Loading default all translations from: ${defaultTranslationsPath}`);

        const translationRows = JSON.parse(fs.readFileSync(defaultTranslationsPath, 'utf8'));

        // Add default language name and country code
        translationRows.unshift({
          stringId: 'languageName',
          [DEFAULT_LANGUAGE_CODE]: 'English',
        });
        translationRows.unshift({
          stringId: 'countryCode',
          [DEFAULT_LANGUAGE_CODE]: 'gb',
        });

        args.log.info('Importing new default translations', { count: translationRows.length });

        if (translationRows.length > 0) {
          await apply('translations', translationRows, args);
          args.log.info('Successfully imported default translations');
        }
      } catch (error) {
        args.log.error(
          'Failed to import default translations, you will need to manually import them',
          { error },
        );
      }

      try {
        const rows = await download('report-translations', xlsxExtractor, {
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
