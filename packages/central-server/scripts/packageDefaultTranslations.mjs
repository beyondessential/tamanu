import { execSync } from 'child_process';

const path = import.meta.dirname;
const rootDir = path.concat('/../../../');
const scrapeTranslationsScriptPath = rootDir.concat('scripts/scrape-translations.sh');
const translationsOutputPath = path.concat('/../dist/default-translations.csv');
const packageTranslationsCommand = `${scrapeTranslationsScriptPath} > ${translationsOutputPath}`;

console.log(`Packaging default translations...`);
execSync(packageTranslationsCommand, {
  stdio: 'inherit',
  cwd: rootDir,
});
