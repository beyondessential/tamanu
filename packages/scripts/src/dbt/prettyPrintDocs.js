#!/usr/bin/env node

const { join } = require('node:path');
const fs = require('node:fs/promises');

function convertToMarkdown(inputText) {
  const blocks = inputText.replace(/\{%\s*enddocs\s*%\}/g, '').split(/\{%\s*docs\s+|\s*%\}/g);

  const cleanBlocks = blocks.map((b) => b.trim()).filter(Boolean);

  let markdown = '';
  for (let i = 0; i < cleanBlocks.length; i += 2) {
    if (i + 1 >= cleanBlocks.length) break;

    // Handle header
    let header = cleanBlocks[i].replace(/__/g, '.');
    if (i === 0) {
      header = header.replace(/^table\./, '');
    } else {
      const tableName = header.split('.')[0];
      header = header.replace(`${tableName}.`, '');
    }
    markdown += `## ${header}\n\n`;

    // Handle content with a step-by-step approach
    let content = cleanBlocks[i + 1].trim();

    // Step 1: Find all reference data entries with types
    const refDataPattern = /\[Reference Data\][\s\S]*?`type=([^`]+)`\)/g;
    content = content.replace(refDataPattern, (match, type) => {
      return `\`Reference Data (${type})\``;
    });

    // Step 2: Find all remaining dbt-style links - more specific pattern
    const linkPattern = /\[([^\]]+)\]\([^)]+\)/g;
    content = content.replace(linkPattern, (match, text) => {
      return `\`${text}\``;
    });

    markdown += `${content}\n\n`;
  }

  return markdown;
}

async function prettyPrintDocs(packageName) {
  console.log('-+', packageName);

  // Source directory where the .md files are
  const modelPath = join('database', 'model', packageName);
  // Target directory for pretty docs
  const prettyPath = join('database', 'pretty-docs', packageName);

  // Create pretty-docs directory if it doesn't exist
  await fs.mkdir(prettyPath, { recursive: true });

  // Process each schema directory
  const schemaDirs = await fs.readdir(modelPath, { withFileTypes: true });
  for (const schemaDir of schemaDirs) {
    if (!schemaDir.isDirectory()) continue;

    const schemaPath = join(modelPath, schemaDir.name);
    const prettySchemaPath = join(prettyPath, schemaDir.name);
    await fs.mkdir(prettySchemaPath, { recursive: true });

    // Process each .md file in the schema directory
    const files = await fs.readdir(schemaPath, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.md')) continue;

      const inputPath = join(schemaPath, file.name);
      const inputText = await fs.readFile(inputPath, 'utf8');
      const markdown = convertToMarkdown(inputText);

      const outputPath = join(prettySchemaPath, file.name);
      await fs.writeFile(outputPath, markdown);
      console.log(` | converted ${schemaDir.name}/${file.name}`);
    }
  }

  console.log(' + done');
  console.log();
}

async function runAll() {
  await prettyPrintDocs('central-server');
  await prettyPrintDocs('facility-server');
}

if (require.main === module) {
  runAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
