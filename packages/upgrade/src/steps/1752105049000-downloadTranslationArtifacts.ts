import config from 'config';
import { parse } from 'csv-parse/sync';
import { uniqBy } from 'lodash';
import { QueryTypes } from 'sequelize';
import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';
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

async function apply(
  artifactType: string,
  extractor: (resp: Response) => Promise<Translation[]>,
  { toVersion, models, log }: StepArgs,
) {
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
  const translationsArtifact = artifacts.find(
    (artifact: any) => artifact.artifact_type === artifactType,
  );
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

  const translationRows = await extractor(translationsResponse);
  if (translationRows.length === 0) {
    throw new Error('No valid translation rows found in CSV');
  }

  log.info(`Importing ${artifactType}`, { count: translationRows.length });

  if (translationRows.length > 0) {
    await models.TranslatedString.sequelize.query(
      `
          INSERT INTO translated_strings (string_id, text, language)
          VALUES ${translationRows.map(() => `(?, ?, '${DEFAULT_LANGUAGE_CODE}')`).join(', ')}
          ON CONFLICT (string_id, language) DO UPDATE SET text = EXCLUDED.text
        `,
      {
        replacements: translationRows.flatMap(row => {
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

async function xlsxExtractor(resp: Response): Promise<Translation[]> {}

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
        await apply('translations', csvExtractor, args);
        args.log.info('Successfully imported default translations');
      } catch (error) {
        try {
          args.log.info('Trying to import default translations from release head instead', {
            version: zeroPatch,
          });
          await apply('translations', csvExtractor, { ...args, toVersion: zeroPatch });
          args.log.info('Successfully imported default translations', {
            version: zeroPatch,
          });
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
        await apply('report-translations', xlsxExtractor, { ...args, toVersion: zeroPatch });
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
