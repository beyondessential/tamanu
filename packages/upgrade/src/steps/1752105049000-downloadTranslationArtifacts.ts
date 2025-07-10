import { QueryTypes } from 'sequelize';
import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType }: StepArgs) {
      // Only run on central server
      return serverType === 'central';
    },
    async run({ toVersion, models, log }: StepArgs) {
      try {
        log.info('Downloading translation artifacts', { version: toVersion });

        // Fetch artifacts list from meta.tamanu.app
        const artifactsUrl = `https://meta.tamanu.app/versions/${toVersion}/artifacts`;
        const artifactsResponse = await fetch(artifactsUrl, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!artifactsResponse.ok) {
          throw new Error(
            `Failed to fetch artifacts list: ${artifactsResponse.status} ${artifactsResponse.statusText}`,
          );
        }

        const artifacts = await artifactsResponse.json();

        const translationsArtifact = artifacts.find(
          (artifact: any) => artifact.artifact_type === 'translations',
        );
        if (!translationsArtifact) {
          throw new Error(`No translations artifact found for version ${toVersion}`);
        }

        log.debug('Downloading translations artifact', {
          url: translationsArtifact.download_url,
        });
        const translationsResponse = await fetch(translationsArtifact.url);
        if (!translationsResponse.ok) {
          throw new Error(
            `Failed to download translations artifact: ${translationsResponse.status} ${translationsResponse.statusText}`,
          );
        }

        const translationsData = await translationsResponse.json();

        // Import translations into the database
        if (
          !translationsData ||
          !Array.isArray(translationsData) ||
          translationsData.length === 0
        ) {
          throw new Error('Empty or invalid translations data');
        }

        log.info('Importing new translations', { count: translationsData.length });

        // Prepare translation data for bulk upsert
        const translationRows = translationsData.flatMap((item: any) => [
          item.stringId,
          item.text,
          item.language,
        ]);

        if (translationRows.length > 0) {
          const [, count] = await models.TranslatedString.sequelize.query(
            `
                INSERT INTO translated_strings (string_id, text, language)
                VALUES ${translationRows.map(() => '(?, ?, ?)').join(', ')}
                ON CONFLICT (string_id, language) DO NOTHING;
              `,
            {
              replacements: translationRows,
              type: QueryTypes.INSERT,
            },
          );

          if (count > 0) {
            log.info('Successfully imported translations', {
              insertedCount: count,
            });
          } else {
            log.info('No new translations imported');
          }
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
