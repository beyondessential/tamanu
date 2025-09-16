#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const constantsPackagePath = path.join(import.meta.dirname, '..', 'packages', 'constants');

const enumTranslationsScript = path.join(
  constantsPackagePath,
  'scripts',
  'printTranslatedEnums.ts',
);

const fileTypes = ['.ts', '.tsx', '.js', '.jsx'];

const readAllFilesRecursive = directoryPath => {
  let filePaths = [];

  const walk = currentPath => {
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

const translatedTextRegex = /stringId="([^"]*)"\s*?fallback="([^"]*)"/gms;
const getTranslationRegex = /getTranslation\(\s*?["'](.*?)["'],.*?["'](.*?)["'].*?\)/gms;

const tamanuRootDir = path.join(import.meta.dirname, '..');

const files = readAllFilesRecursive(process.argv[2] || tamanuRootDir);

const translations = new Map();
const duplicates = new Map();

const addTranslation = (stringId, defaultText, fileName) => {
  if (translations.has(stringId) && translations.get(stringId).defaultText !== defaultText) {
    duplicates.set(stringId, [
      ...(duplicates.get(stringId) || []),
      { stringId, defaultText, fileName },
    ]);
  } else {
    translations.set(stringId, { stringId, defaultText, fileName });
  }
};

const enumTranslations = JSON.parse(execSync(`npx --yes tsx ${enumTranslationsScript}`).toString());
enumTranslations.forEach(({ stringId, defaultText }) => {
  addTranslation(stringId, defaultText, 'enumRegistry');
});

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const ttMatches = content.matchAll(translatedTextRegex);
  const gtMatches = content.matchAll(getTranslationRegex);

  for (const match of [...ttMatches, ...gtMatches]) {
    const [, stringId, defaultText] = match;
    if (stringId) {
      addTranslation(stringId, defaultText, file);
    }
  }
}

if (duplicates.size > 0) {
  const errorMessage = `Duplicates found: ${Array.from(duplicates.entries())
    .map(([stringId, duplicates]) => `${stringId}: ${duplicates.map(d => d.fileName).join(', ')}`)
    .join('\n')}`;
  throw new Error(errorMessage);
}

const translationRows = Array.from(translations.values())
  .map(
    ({ stringId, defaultText }) =>
      `"${stringId}","${`${defaultText}`
        .split('\n')
        .map(line => line.trim())
        .join(' ')}"`,
  )
  .sort();

// Write out csv header and data
console.log(
  'stringId,default\n"languageName","English"\n"countryCode","gb"\n'.concat(
    translationRows.join('\n'),
  ),
);
