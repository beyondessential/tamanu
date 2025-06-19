#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENARIOS_DIR = path.join(__dirname, '../scenarios');
const CONFIG_FILE = path.join(__dirname, '../config/common-config.yml');
const OUTPUT_FILE = path.join(__dirname, '../merged-scenarios.yml');

const comment = `# ⚠️ Auto-generated file
# Do not edit directly. Regenerate with:
#   npm run merge-scenarios
#
`;

const isYaml = (file) => file.endsWith('.yml') || file.endsWith('.yaml');

const adjustProcessorPath = (config) => {
  if (config.processor) {
    const absolutePath = path.resolve(path.dirname(CONFIG_FILE), config.processor);
    const relativePath = path.relative(path.dirname(OUTPUT_FILE), absolutePath);
    config.processor = relativePath;
  }

  return config;
};

async function mergeScenarios() {
  const config = fs.readFileSync(CONFIG_FILE, 'utf8');
  const configParsed = yaml.load(config)?.config;

  if (!configParsed) {
    throw new Error('Common config file is empty');
  }

  const scenarioFiles = fs.readdirSync(SCENARIOS_DIR);
  const yamlFiles = scenarioFiles.filter(isYaml);

  const mergedScenarios = [];

  for (const yamlFile of yamlFiles) {
    const filePath = path.join(SCENARIOS_DIR, yamlFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(fileContent);

    if (!parsed || !parsed.scenarios) {
      console.warn(`Skipping ${yamlFile} because it doesn't contain scenarios`);
      continue;
    }

    mergedScenarios.push(...parsed.scenarios);
  }

  const merged = {
    config: adjustProcessorPath(configParsed),
    scenarios: mergedScenarios,
  };

  fs.writeFileSync(OUTPUT_FILE, comment + yaml.dump(merged), 'utf8', (err) => {
    if (err) {
      console.error('Error writing merged scenarios file:', err);
      process.exit(1);
    }

    console.log(`Merged scenarios file written to ${OUTPUT_FILE}`);
  });
}

mergeScenarios().catch(console.error);
