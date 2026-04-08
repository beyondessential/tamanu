#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENARIOS_DIR = path.join(__dirname, '../scenarios');
const CONFIG_FILE = path.join(__dirname, '../config/common-config.yml');
const OUTPUT_DIR = path.join(__dirname, '..');

const SERVER_TYPES = ['central', 'facility'];

const comment = `# ⚠️ Auto-generated file
# Do not edit directly. Regenerate with:
#   npm run merge-scenarios
#
`;

const isYaml = (file) => file.endsWith('.yml') || file.endsWith('.yaml');

const adjustProcessorPath = (config, outputFile) => {
  if (config.processor) {
    const absolutePath = path.resolve(path.dirname(CONFIG_FILE), config.processor);
    config.processor = path.relative(path.dirname(outputFile), absolutePath);
  }
  return config;
};

function collectScenarios(dir) {
  if (!fs.existsSync(dir)) return [];

  const scenarios = [];
  for (const file of fs.readdirSync(dir).filter(isYaml)) {
    const content = yaml.load(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!content?.scenarios) {
      console.warn(`Skipping ${file} — no scenarios key`);
      continue;
    }
    scenarios.push(...content.scenarios);
  }
  return scenarios;
}

async function mergeScenarios() {
  const configParsed = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8'))?.config;
  if (!configParsed) throw new Error('Common config file is empty');

  for (const serverType of SERVER_TYPES) {
    const scenarios = collectScenarios(path.join(SCENARIOS_DIR, serverType));
    if (scenarios.length === 0) {
      console.log(`No ${serverType} scenarios found, skipping`);
      continue;
    }

    const outputFile = path.join(OUTPUT_DIR, `merged-${serverType}.yml`);
    const merged = {
      config: adjustProcessorPath({ ...configParsed }, outputFile),
      scenarios,
    };

    fs.writeFileSync(outputFile, comment + yaml.dump(merged), 'utf8');
    console.log(`Wrote ${outputFile} (${scenarios.length} scenarios)`);
  }
}

mergeScenarios().catch(console.error);
