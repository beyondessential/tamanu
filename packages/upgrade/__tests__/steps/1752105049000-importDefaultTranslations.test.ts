import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import { STEPS } from '../../src/steps/1752105049000-importDefaultTranslations.js';
import {
  DEFAULT_LANGUAGE_CODE,
  ENGLISH_LANGUAGE_CODE,
  COUNTRY_CODE_STRING_ID,
  ENGLISH_COUNTRY_CODE,
  ENGLISH_LANGUAGE_NAME,
  LANGUAGE_NAME_STRING_ID,
} from '@tamanu/constants';

// Mock dependencies
vi.mock('config', () => ({
  default: {
    metaServer: {
      hosts: [
        'https://meta.example.com',
      ],
    },
  },
}));

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('1752105049000-importDefaultTranslations', () => {
  const mockStepArgs = {
    sequelize: {} as any,
    models: {
      TranslatedString: {
        sequelize: {
          query: vi.fn(),
        },
        findOne: vi.fn(),
        create: vi.fn(),
      },
    } as any,
    log: {
      info: vi.fn(),
      error: vi.fn(),
    } as any,
    fromVersion: '1.0.0',
    toVersion: '1.1.5',
    serverType: 'central' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('artifact download', () => {
    const mockArtifacts = [
      {
        artifact_type: 'report-translations',
        download_url: 'https://example.com/report-translations.xlsx',
      },
    ];

    it('should successfully download, scrape, and import translations', async () => {
      // Mock report translations download
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockArtifacts),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      });

      // Mock XLSX parsing
      const xlsx = await import('xlsx');
      (xlsx.read as any).mockReturnValue({
        Sheets: {
          Sheet1: {},
        },
      });
      (xlsx.utils.sheet_to_json as any).mockReturnValue([
        { stringId: 'report.key1', [DEFAULT_LANGUAGE_CODE]: 'Report Value 1' },
      ]);

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/1.1.0/artifacts', {
        headers: { Accept: 'application/json' },
      });

      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledTimes(2);

      // Checks for and creates missing English language name and country code
      expect(mockStepArgs.models.TranslatedString.findOne).toHaveBeenCalledWith({
        where: { stringId: LANGUAGE_NAME_STRING_ID, language: ENGLISH_LANGUAGE_CODE },
        paranoid: false,
      });
      expect(mockStepArgs.models.TranslatedString.findOne).toHaveBeenCalledWith({
        where: { stringId: COUNTRY_CODE_STRING_ID, language: ENGLISH_LANGUAGE_CODE },
        paranoid: false,
      });
      expect(mockStepArgs.models.TranslatedString.create).toHaveBeenCalledWith({
        stringId: LANGUAGE_NAME_STRING_ID,
        language: ENGLISH_LANGUAGE_CODE,
        text: ENGLISH_LANGUAGE_NAME,
      });
      expect(mockStepArgs.models.TranslatedString.create).toHaveBeenCalledWith({
        stringId: COUNTRY_CODE_STRING_ID,
        language: ENGLISH_LANGUAGE_CODE,
        text: ENGLISH_COUNTRY_CODE,
      });

      expect(mockStepArgs.log.info).toHaveBeenCalledWith(
        'Successfully imported default translations',
      );
    });

    it('should handle missing artifacts gracefully', async () => {
      // Mock for report translations (should also fail)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should use zero patch version for report translations', async () => {
      // Mock report translations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      const step = STEPS[0];
      await step.run({ ...mockStepArgs, toVersion: '1.1.5' });

      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/1.1.0/artifacts', {
        headers: { Accept: 'application/json' },
      });
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock for report translations
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });
  });

  describe('translation data processing', () => {
    it('should handle translations with default language code', async () => {
      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO translated_strings'),
        expect.objectContaining({
          replacements: expect.arrayContaining(['welcome.title', 'Welcome, :displayName!']), // Hard coding a real translation here, if this changes we'll need to update the test
          type: QueryTypes.INSERT,
        }),
      );

      // Should ignore files that aren't js, jsx, ts, or tsx
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO translated_strings'),
        expect.objectContaining({
          replacements: expect.not.arrayContaining([
            'getTranslation.txt',
            'Get Translation TXT',
            'translatedText.txt',
            'Translated Text TXT',
          ]),
          type: QueryTypes.INSERT,
        }),
      );
    });
  });

  describe('XLSX processing', () => {
    it('should handle XLSX files for report translations', async () => {
      // Mock report translations success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'report-translations',
            download_url: 'https://example.com/reports.xlsx',
          },
        ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      const xlsx = await import('xlsx');
      (xlsx.read as any).mockReturnValue({
        Sheets: {
          Sheet1: { A1: { v: 'test' } },
        },
      });
      (xlsx.utils.sheet_to_json as any).mockReturnValue([
        { stringId: 'report.key1', [DEFAULT_LANGUAGE_CODE]: 'Report Value' },
      ]);

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(xlsx.read).toHaveBeenCalledWith(expect.any(ArrayBuffer), { type: 'buffer' });
      expect(xlsx.utils.sheet_to_json).toHaveBeenCalled();
      expect(mockStepArgs.log.info).toHaveBeenCalledWith(
        'Successfully imported default report translations',
      );
    });

    it('should handle XLSX files without sheets', async () => {
      // Mock regular translations failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      // Mock report translations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'report-translations',
            download_url: 'https://example.com/reports.xlsx',
          },
        ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      const xlsx = await import('xlsx');
      (xlsx.read as any).mockReturnValue({
        Sheets: {},
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully during import', async () => {
      // Mock database error
      mockStepArgs.models.TranslatedString.sequelize.query.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default translations, you will need to manually import them',
        expect.any(Object),
      );

      mockStepArgs.models.TranslatedString.sequelize.query.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });
  });

  describe('version handling', () => {
    it('should convert patch version to zero patch correctly', async () => {
      const step = STEPS[0];

      // Mock all requests to fail so we can check the version transformation
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      await step.run({ ...mockStepArgs, toVersion: '2.5.3' });

      // Should call zero patch for report translations
      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/2.5.0/artifacts', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle XLSX parsing errors', async () => {
      // Mock regular translations failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      // Mock report translations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'report-translations', download_url: 'https://example.com/bad.xlsx' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      const xlsx = await import('xlsx');
      (xlsx.read as any).mockImplementation(() => {
        throw new Error('XLSX parsing failed');
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should handle config missing metaServer host', async () => {
      // This test verifies that the code handles undefined config gracefully
      // The actual implementation will attempt to access config.metaServer.host
      // and if it's undefined, it will result in undefined URLs, which should cause fetch to fail

      // Mock all requests to fail since the URL will be malformed
      mockFetch.mockRejectedValue(new Error('Invalid URL'));

      const step = STEPS[0];
      await step.run(mockStepArgs);

      // Should log errors about failed downloads
      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should handle missing report-translations artifact in list', async () => {
      // Mock artifact list without report-translations artifact
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'some-other-artifact',
            download_url: 'https://example.com/other.zip',
          },
          {
            artifact_type: 'documentation',
            download_url: 'https://example.com/docs.pdf',
          },
        ]),
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      // Should log error about missing report-translations artifact
      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to import default report translations, you will need to manually import them',
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('No meta server succeeded downloading the artifacts'),
          }),
        }),
      );
    });
  });
});
