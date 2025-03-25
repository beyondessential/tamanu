#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Paths to transform
const paths = ['packages/web/app/components', 'packages/web/app/views', 'package/web/app/forms'];

// Check if --dry flag is passed
const isDryRun = process.argv.includes('--dry');

// Run the codemod
try {
  paths.forEach((dir) => {
    console.log(`\nProcessing directory: ${dir}`);

    const command = `npx jscodeshift -t ${path.join(__dirname, 'add-test-ids.cjs')} ${dir} --parser=tsx --extensions=js,jsx,ts,tsx ${isDryRun ? '--dry' : ''} --verbose=2`;

    console.log(`Running command: ${command}\n`);
    execSync(command, { stdio: 'inherit' });
  });

  console.log('\nCodemod completed successfully!');
  if (isDryRun) {
    console.log('This was a dry run. No files were actually modified.');
    console.log('Run without --dry to apply the changes.');
  }
} catch (error) {
  console.error('Error running codemod:', error);
  process.exit(1);
}
