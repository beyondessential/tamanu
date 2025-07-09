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
            'Accept': 'application/json',
          },
        });
        
        if (!artifactsResponse.ok) {
          throw new Error(`Failed to fetch artifacts list: ${artifactsResponse.status} ${artifactsResponse.statusText}`);
        }
        
        const artifacts = await artifactsResponse.json();
        
        // Find the translations artifact
        const translationsArtifact = artifacts.find((artifact: any) => artifact.name === 'translations');
        
        if (!translationsArtifact) {
          log.warn('No translations artifact found for version', { version: toVersion });
          return;
        }
        
        log.info('Found translations artifact', { 
          version: toVersion, 
          artifactUrl: translationsArtifact.url 
        });
        
        // Download the translations artifact
        const translationsResponse = await fetch(translationsArtifact.url);
        
        if (!translationsResponse.ok) {
          throw new Error(`Failed to download translations artifact: ${translationsResponse.status} ${translationsResponse.statusText}`);
        }
        
        const translationsData = await translationsResponse.json();
        
        // Import translations into the database
        if (translationsData && Array.isArray(translationsData)) {
          log.info('Importing translations', { count: translationsData.length });
          
          // Prepare translation data for bulk upsert
          const translationRows = translationsData.map((item: any) => [
            item.stringId,
            item.text,
            item.language,
          ]);
          
          if (translationRows.length > 0) {
            await models.TranslatedString.sequelize.query(
              `
                INSERT INTO translated_strings (string_id, text, language)
                VALUES ${translationRows.map(() => '(?, ?, ?)').join(', ')}
                ON CONFLICT (string_id, language) DO UPDATE SET text = excluded.text;
              `,
              {
                replacements: translationRows.flat(),
                type: QueryTypes.INSERT,
              },
            );
            
            log.info('Successfully imported translations', { count: translationRows.length });
          }
        } else {
          log.warn('Invalid translations data format received');
        }
        
      } catch (error) {
        log.error('Failed to download or import translation artifacts', { 
          error: error instanceof Error ? error.message : String(error),
          version: toVersion 
        });
        // Don't throw - we don't want to fail the entire upgrade process for translations
        // The system can continue to work with existing translations
      }
    },
  },
];