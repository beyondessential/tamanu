import config from 'config';
import { parse } from 'csv-parse/sync';
import { QueryTypes } from 'sequelize';
import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

interface Artifact {
  artifact_type: string;
  download_url: string;
}

interface Translation {
  stringId: string;
  default?: string; // from 2.36 maybe?
  en?: string; // from 2.28
  fallback?: string; // legacy
}

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType }: StepArgs) {
      // Only run on central server
      return serverType === 'central';
    },
    async run({ toVersion, models, log }: StepArgs) {
      try {
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
          (artifact: any) => artifact.artifact_type === 'translations',
        );
        if (!translationsArtifact) {
          throw new Error(`No translations artifact found for version ${toVersion}`);
        }

        log.info('Downloading translations artifact', {
          url: translationsArtifact.download_url,
        });
        const translationsResponse = await fetch(translationsArtifact.download_url);
        if (!translationsResponse.ok) {
          throw new Error(
            `Failed to download translations artifact: ${translationsResponse.status} ${translationsResponse.statusText}`,
          );
        }

        const translationRows = parse(await translationsResponse.text(), {
          columns: true,
          skip_empty_lines: true,
        }) as unknown as Translation[];

        if (translationRows.length === 0) {
          throw new Error('No valid translation rows found in CSV');
        }

        log.info('Importing new default translations', { count: translationRows.length });

        if (translationRows.length > 0) {
          await models.TranslatedString.sequelize.query(
            `
                INSERT INTO translated_strings (string_id, text, language)
                VALUES ${translationRows.map(() => "(?, ?, 'default')").join(', ')}
                ON CONFLICT (string_id, language) DO UPDATE SET text = EXCLUDED.text
              `,
            {
              replacements: translationRows.flatMap(row => {
                const text = row.default ?? row.en ?? row.fallback;
                return text ? [row.stringId, text] : [];
              }),
              type: QueryTypes.INSERT,
            },
          );

          log.info('Successfully imported default translations');
        }
      } catch (error) {
        // Failing to import translations is not world-ending... for now
        // We may want to make this more strict in the future
        log.error('Failed to import translations, you will need to manually import them', {
          error,
        });
      }
    },
  },
];
