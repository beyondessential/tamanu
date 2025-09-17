import fs from 'fs';
import path from 'path';
import { enumTranslations } from '@tamanu/constants/enumRegistry';
import { DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';

type ScrapeTranslationsOptions = {
  includeEnumTranslations?: boolean;
};

export const scrapeTranslations = async (
  rootDir: string,
  { includeEnumTranslations = true }: ScrapeTranslationsOptions = {},
) => {
  const fileTypes = ['.ts', '.tsx', '.js', '.jsx'];

  const readAllFilesRecursive = (directoryPath: string) => {
    const filePaths: string[] = [];

    const walk = (currentPath: string) => {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        if (item.isDirectory()) {
          walk(fullPath); // Recursively call for subdirectories
        } else if (item.isFile()) {
          if (fileTypes.some(type => fullPath.endsWith(type))) {
            filePaths.push(fullPath); // Add file path to the list
          }
        }
      }
    };

    walk(directoryPath);
    return filePaths;
  };

  const files = readAllFilesRecursive(rootDir);

  const translatedTextRegex = /stringId="([^"]*)"\s*?fallback="([^"]*)"/gms;
  const getTranslationRegex = /getTranslation\(\s*?["'](.*?)["'],.*?["'](.*?)["'].*?\)/gms;

  const translations = new Map<
    string,
    { stringId: string; defaultText: string; fileName: string }
  >();
  const duplicates = new Map<
    string,
    { stringId: string; defaultText: string; fileName: string }[]
  >();

  const addTranslation = (stringId: string, defaultText: string, fileName: string) => {
    if (translations.has(stringId) && translations.get(stringId)?.defaultText !== defaultText) {
      duplicates.set(stringId, [
        ...(duplicates.get(stringId) || []),
        { stringId, defaultText, fileName },
      ]);
    } else {
      translations.set(stringId, { stringId, defaultText, fileName });
    }
  };

  if (includeEnumTranslations) {
    enumTranslations.forEach(([key, value]) => {
      addTranslation(`${key}`, `${value}`, 'enumRegistry');
    });
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const ttMatches = content.matchAll(translatedTextRegex);
    const gtMatches = content.matchAll(getTranslationRegex);

    for (const match of [...ttMatches, ...gtMatches]) {
      const [, stringId, defaultText] = match;
      if (stringId) {
        addTranslation(stringId, defaultText || '', file);
      }
    }
  }

  if (duplicates.size > 0) {
    const errorMessage = `Duplicates found: ${Array.from(duplicates.entries())
      .map(([stringId, duplicates]) => `${stringId}: ${duplicates.map(d => d.fileName).join(', ')}`)
      .join('\n')}`;
    throw new Error(errorMessage);
  }

  // Remove any newlines in the default text
  const flattenDefaultText = (defaultText: string) => {
    return defaultText
      .split('\n')
      .map(line => line.trim())
      .join(' ');
  };

  const translationRows = Array.from(translations.values())
    .map(({ stringId, defaultText }) => ({
      stringId,
      [DEFAULT_LANGUAGE_CODE]: flattenDefaultText(defaultText),
    }))
    .sort((a, b) => a.stringId.localeCompare(b.stringId));

  return translationRows;
};
