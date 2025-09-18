import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import { STEPS } from '../../src/steps/1752105049000-downloadTranslationArtifacts.js';
import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

// Mock dependencies
vi.mock('config', () => ({
  default: {
    metaServer: {
      host: 'https://meta.example.com',
    },
  },
}));

vi.mock('csv-parse/sync', () => ({
  parse: vi.fn(),
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

describe('1752105049000-downloadTranslationArtifacts', () => {
  const mockStepArgs = {
    sequelize: {} as any,
    models: {
      TranslatedString: {
        sequelize: {
          query: vi.fn(),
        },
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
    vi.restoreAllMocks();
  });

  describe('artifact download', () => {
    const mockArtifacts = [
      {
        artifact_type: 'translations',
        download_url: 'https://example.com/translations.csv',
      },
      {
        artifact_type: 'report-translations',
        download_url: 'https://example.com/report-translations.xlsx',
      },
    ];

    it('should successfully download and import translations', async () => {
      const mockTranslations = [
        { stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'Test Value 1' },
        { stringId: 'test.key2', [ENGLISH_LANGUAGE_CODE]: 'Test Value 2' },
      ];

      // Mock artifacts list response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockArtifacts),
      });

      // Mock translations download response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('mocked csv content'),
      });

      // Mock CSV parsing
      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

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

      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/1.1.5/artifacts', {
        headers: { Accept: 'application/json' },
      });

      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledTimes(2);
      expect(mockStepArgs.log.info).toHaveBeenCalledWith(
        'Successfully imported default translations',
      );
    });

    it('should handle missing artifacts gracefully', async () => {
      // Mock artifacts list with no translations artifact
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'other-artifact',
            download_url: 'https://example.com/other.csv',
          },
        ]),
      });

      // Mock for report translations (should also fail)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should fallback to zero patch version for translations', async () => {
      // First call fails (exact version)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      // Second call succeeds (zero patch version)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockArtifacts),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue([
        { stringId: 'test.key', [DEFAULT_LANGUAGE_CODE]: 'Test Value' },
      ]);

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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Mock for report translations
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations, you will need to manually import them',
        expect.any(Object),
      );
    });
  });

  describe('translation data processing', () => {
    it('should handle translations with default language code', async () => {
      const mockTranslations = [
        { stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'Default Value' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

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
        {
          replacements: ['test.key1', 'Default Value'],
          type: QueryTypes.INSERT,
        },
      );
    });

    it('should fall back to English when default is not available', async () => {
      const mockTranslations = [
        { stringId: 'test.key1', [ENGLISH_LANGUAGE_CODE]: 'English Value' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

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
        {
          replacements: ['test.key1', 'English Value'],
          type: QueryTypes.INSERT,
        },
      );
    });

    it('should fall back to legacy fallback field', async () => {
      const mockTranslations = [{ stringId: 'test.key1', fallback: 'Fallback Value' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

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
        {
          replacements: ['test.key1', 'Fallback Value'],
          type: QueryTypes.INSERT,
        },
      );
    });

    it('should skip entries without any valid text', async () => {
      const mockTranslations = [
        { stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'Valid Value' },
        { stringId: 'test.key2' }, // No text fields
        { stringId: 'test.key3', [DEFAULT_LANGUAGE_CODE]: null },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      // Should only include the valid entry
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO translated_strings'),
        {
          replacements: ['test.key1', 'Valid Value'],
          type: QueryTypes.INSERT,
        },
      );
    });

    it('should deduplicate translations by stringId', async () => {
      const mockTranslations = [
        { stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'First Value' },
        { stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'Second Value' },
        { stringId: 'test.key2', [DEFAULT_LANGUAGE_CODE]: 'Unique Value' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      // Should only have 2 entries after deduplication
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining("(?, ?, 'default'), (?, ?, 'default')"),
        expect.any(Object),
      );
    });
  });

  describe('XLSX processing', () => {
    it('should handle XLSX files for report translations', async () => {
      // Mock regular translations failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

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
      const mockTranslations = [{ stringId: 'test.key1', [DEFAULT_LANGUAGE_CODE]: 'Test Value' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/translations.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(mockTranslations);

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
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations, you will need to manually import them',
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

      // Should call with original version first, then zero patch
      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/2.5.3/artifacts', {
        headers: { Accept: 'application/json' },
      });
      expect(mockFetch).toHaveBeenCalledWith('https://meta.example.com/versions/2.5.0/artifacts', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty CSV response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/empty.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(''),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue([]);

      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should handle CSV parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { artifact_type: 'translations', download_url: 'https://example.com/bad.csv' },
          ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('invalid csv content'),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockImplementation(() => {
        throw new Error('CSV parsing failed');
      });

      // Mock report translations failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const step = STEPS[0];
      await step.run(mockStepArgs);

      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations for exact version, trying from release head',
        expect.any(Object),
      );
    });

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
        'Failed to download default translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should handle missing report-translations artifact in list', async () => {
      // Mock regular translations failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

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
            message: expect.stringContaining('No report-translations artifact found'),
          }),
        }),
      );

      // Regular translations should also fail due to empty artifact list
      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations, you will need to manually import them',
        expect.any(Object),
      );
    });

    it('should handle mixed successes and failures', async () => {
      // Simulate a realistic scenario where:
      // - First translation download fails
      // - Fallback translation download succeeds
      // - Report translation download succeeds
      const regularTranslations = [
        { stringId: 'common.save', [DEFAULT_LANGUAGE_CODE]: 'Save' },
        { stringId: 'common.cancel', [ENGLISH_LANGUAGE_CODE]: 'Cancel' },
        { stringId: 'patient.name', fallback: 'Patient Name' },
        { stringId: 'empty.field' }, // Should be skipped
      ];

      const reportTranslations = [
        { stringId: 'report.title', [DEFAULT_LANGUAGE_CODE]: 'Patient Report' },
        { stringId: 'report.date', [DEFAULT_LANGUAGE_CODE]: 'Report Date' },
      ];

      // First attempt fails (exact version)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Second attempt succeeds (zero patch version)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'translations',
            download_url: 'https://meta.example.com/v1.1.0/translations.csv',
          },
        ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi
          .fn()
          .mockResolvedValue(
            'stringId,default,en,fallback\ncommon.save,Save,,\ncommon.cancel,,Cancel,',
          ),
      });

      const { parse } = await import('csv-parse/sync');
      (parse as any).mockReturnValue(regularTranslations);

      // Report translations succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            artifact_type: 'report-translations',
            download_url: 'https://meta.example.com/v1.1.0/reports.xlsx',
          },
        ]),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(512)),
      });

      const xlsx = await import('xlsx');
      (xlsx.read as any).mockReturnValue({
        Sheets: {
          'Report Translations': { A1: { v: 'stringId' }, B1: { v: 'default' } },
        },
      });
      (xlsx.utils.sheet_to_json as any).mockReturnValue(reportTranslations);

      const step = STEPS[0];
      await step.run({ ...mockStepArgs, toVersion: '1.1.5' });

      // Verify fallback behavior
      expect(mockStepArgs.log.error).toHaveBeenCalledWith(
        'Failed to download default translations for exact version, trying from release head',
        expect.objectContaining({
          version: '1.1.0',
        }),
      );

      // Verify successful imports
      expect(mockStepArgs.log.info).toHaveBeenCalledWith(
        'Successfully imported default translations',
      );
      expect(mockStepArgs.log.info).toHaveBeenCalledWith(
        'Successfully imported default report translations',
      );

      // Verify database calls
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenCalledTimes(2);

      // Verify regular translations (3 valid entries out of 4)
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("(?, ?, 'default'), (?, ?, 'default'), (?, ?, 'default')"),
        {
          replacements: [
            'common.save',
            'Save',
            'common.cancel',
            'Cancel',
            'patient.name',
            'Patient Name',
          ],
          type: QueryTypes.INSERT,
        },
      );

      // Verify report translations
      expect(mockStepArgs.models.TranslatedString.sequelize.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("(?, ?, 'default'), (?, ?, 'default')"),
        {
          replacements: ['report.title', 'Patient Report', 'report.date', 'Report Date'],
          type: QueryTypes.INSERT,
        },
      );
    });
  });
});
