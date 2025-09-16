import { execSync } from 'child_process';

const path = import.meta.dirname;
const rootDir = path.concat('/../../../');
const scrapeTranslationsScriptPath = rootDir.concat('scripts/scrape-translations.mjs');
const translationsOutputPath = path.concat('/../dist/default-translations.csv');
const packageTranslationsCommand = `node ${scrapeTranslationsScriptPath} > ${translationsOutputPath}`;

console.log(`Packaging default translations...`);
execSync(packageTranslationsCommand, {
  stdio: 'inherit',
  cwd: rootDir,
});
