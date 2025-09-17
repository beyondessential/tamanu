import path from 'path';
import { QueryTypes } from 'sequelize';
import type { Steps, StepArgs } from '../step.js';
import { END } from '../step.js';
import { DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';
import { scrapeTranslations } from './scripts/scrapeTranslations.js';

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

async function csvExtractor(resp: Response): Promise<Translation[]> {
  return uniqBy(
    parse(await resp.text(), {
      columns: true,
      skip_empty_lines: true,
    }) as unknown as Translation[],
    item => item.stringId,
  );
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
    async run({ models, log }: StepArgs) {
      try {
        const tamanuRoot = path.join(import.meta.dirname, '..', '..', '..');

        const translationRows = await scrapeTranslations(tamanuRoot);

        // Add default language name and country code
        translationRows.unshift({
          stringId: 'languageName',
          defaultText: 'English',
        });
        translationRows.unshift({
          stringId: 'countryCode',
          defaultText: 'gb',
        });

        log.info('Importing new default translations', { count: translationRows.length });

        if (translationRows.length > 0) {
          await models.TranslatedString.sequelize.query(
            `
                INSERT INTO translated_strings (string_id, text, language)
                VALUES ${translationRows.map(() => `(?, ?, '${DEFAULT_LANGUAGE_CODE}')`).join(', ')}
                ON CONFLICT (string_id, language) DO UPDATE SET text = EXCLUDED.text
              `,
            {
              replacements: translationRows.flatMap(row => [row.stringId, row.defaultText]),
              type: QueryTypes.INSERT,
            },
          );
        }
      }

      if (rows.length === 0) {
        try {
          rows = await download('translations', csvExtractor, { ...args, toVersion: zeroPatch });
        } catch (error) {
          args.log.error(
            'Failed to download default translations, you will need to manually import them',
            {
              error,
              version: zeroPatch,
            },
          );
        }
      }

      if (rows.length > 0) {
        try {
          await apply('translations', rows, args);
          args.log.info('Successfully imported default translations');
        } catch (error) {
          // Failing to import translations is not world-ending... for now
          // We may want to make this more strict in the future
          args.log.error(
            'Failed to import default translations, you will need to manually import them',
            {
              error,
            },
          );
        }
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
