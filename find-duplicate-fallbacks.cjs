#!/usr/bin/env node
/* eslint-env node */

const fs = require('fs');
const path = require('path');

// Color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

console.log(`${colors.bold}${colors.blue}🔍 DUPLICATE FALLBACK DETECTOR v2.0${colors.reset}`);
console.log(
  `${colors.cyan}Enhanced precision analysis for translation component validation${colors.reset}\n`,
);

// Function to scan files recursively
function scanDirectory(directory) {
  const results = [];

  try {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      // Skip node_modules and other unwanted directories
      if (stat.isDirectory() && !['node_modules', '.git', 'build', 'dist'].includes(item)) {
        results.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read due to permissions
  }

  return results;
}

// Improved function to extract TranslatedText components
function extractTranslatedTextData(content, filePath) {
  const translatedTextMatches = [];

  // First, find all TranslatedText component matches (including multi-line)
  const componentRegex = /<TranslatedText[\s\S]*?\/?>/g;
  let match;

  while ((match = componentRegex.exec(content)) !== null) {
    const component = match[0];
    const startIndex = match.index;

    // Find line number
    const beforeMatch = content.substring(0, startIndex);
    const lineNumber = beforeMatch.split('\n').length;

    // Extract stringId and fallback from the component
    const stringIdMatch = component.match(/stringId=(['"`])([^'"`]*?)\1/);
    let fallbackMatch = null;

    // Try different fallback patterns
    // Pattern 1: fallback="..." or fallback='...'
    fallbackMatch = component.match(/fallback=(['"])([^'"`]*?)\1/);

    // Pattern 2: fallback={`...`} (template literal)
    if (!fallbackMatch) {
      fallbackMatch = component.match(/fallback=\{`([^`]*?)`\}/);
      if (fallbackMatch) {
        fallbackMatch = [fallbackMatch[0], '`', fallbackMatch[1]]; // Normalize format
      }
    }

    // Pattern 3: fallback={"..."} (string in braces)
    if (!fallbackMatch) {
      fallbackMatch = component.match(/fallback=\{(['"])([^'"`]*?)\1\}/);
      if (fallbackMatch) {
        fallbackMatch = [fallbackMatch[0], fallbackMatch[1], fallbackMatch[2]]; // Normalize format
      }
    }

    if (stringIdMatch && fallbackMatch) {
      const stringId = stringIdMatch[2].trim();
      const fallback = fallbackMatch[2].trim();

      // Only include if both stringId and fallback are non-empty and look valid
      if (
        stringId &&
        fallback &&
        stringId.length > 0 &&
        fallback.length > 0 &&
        !stringId.includes('<') &&
        !fallback.includes('<') && // Avoid HTML tags
        stringId !== fallback
      ) {
        // Avoid cases where they're the same

        translatedTextMatches.push({
          stringId: stringId,
          fallback: fallback,
          file: filePath,
          line: lineNumber,
          match: component.substring(0, 150) + (component.length > 150 ? '...' : ''),
        });
      }
    }
  }

  return translatedTextMatches;
}

// Main scanning function
function scanForTranslatedText() {
  console.log(
    `${colors.yellow}🔍 Scanning codebase for TranslatedText components... This may take a few moments${colors.reset}`,
  );

  const allFiles = scanDirectory('./packages');
  const allMatches = [];
  let skippedMatches = 0;

  let filesScanned = 0;
  for (const filePath of allFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = extractTranslatedTextData(content, filePath);
      allMatches.push(...matches);
      filesScanned++;

      if (filesScanned % 50 === 0) {
        console.log(
          `${colors.cyan}Scanned ${filesScanned} files... Processing continues${colors.reset}`,
        );
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  console.log(
    `${colors.green}✅ Scan complete! Found ${allMatches.length} valid TranslatedText components in ${filesScanned} files.${colors.reset}`,
  );
  if (skippedMatches > 0) {
    console.log(
      `${colors.yellow}⚠️  Skipped ${skippedMatches} malformed matches for data quality.${colors.reset}`,
    );
  }
  console.log('');
  return allMatches;
}

// Function to find duplicate fallbacks
function findDuplicateFallbacks(matches) {
  console.log(
    `${colors.bold}${colors.magenta}🎯 ANALYZING FOR DUPLICATE FALLBACKS...${colors.reset}`,
  );
  console.log(
    `${colors.cyan}Identifying fallback texts used with multiple different stringIds${colors.reset}\n`,
  );

  // Group by fallback text
  const fallbackGroups = {};

  for (const match of matches) {
    if (!fallbackGroups[match.fallback]) {
      fallbackGroups[match.fallback] = [];
    }
    fallbackGroups[match.fallback].push(match);
  }

  // Find groups with multiple different stringIds
  const duplicates = {};
  for (const [fallback, items] of Object.entries(fallbackGroups)) {
    const uniqueStringIds = new Set(items.map((item) => item.stringId));
    if (uniqueStringIds.size > 1) {
      duplicates[fallback] = {
        stringIds: Array.from(uniqueStringIds),
        occurrences: items,
      };
    }
  }

  return duplicates;
}

// Function to display a sample of problematic matches for debugging
function displaySampleMatches(allMatches, limit = 10) {
  console.log(
    `${colors.bold}${colors.blue}🔍 SAMPLE MATCHES (for quality verification):${colors.reset}`,
  );

  const sample = allMatches.slice(0, limit);
  for (const match of sample) {
    const relativePath = match.file.replace(process.cwd() + '/', '');
    console.log(`${colors.white}📁 ${relativePath}:${match.line}${colors.reset}`);
    console.log(`${colors.cyan}   StringId: "${match.stringId}"${colors.reset}`);
    console.log(`${colors.yellow}   Fallback: "${match.fallback}"${colors.reset}`);
    console.log(`${colors.magenta}   Component: ${match.match}${colors.reset}`);
    console.log('');
  }

  if (allMatches.length > limit) {
    console.log(`${colors.cyan}... and ${allMatches.length - limit} more matches${colors.reset}\n`);
  }
}

// Function to display results
function displayResults(duplicates, allMatches) {
  const duplicateCount = Object.keys(duplicates).length;

  // Show sample matches first for quality verification
  if (allMatches.length > 0) {
    displaySampleMatches(allMatches);
  }

  if (duplicateCount === 0) {
    console.log(
      `${colors.bold}${colors.green}🏆 SUCCESS! No duplicate fallbacks found!${colors.reset}`,
    );
    console.log(
      `${colors.green}Your translation components are properly organized with unique fallbacks${colors.reset}\n`,
    );
    return;
  }

  console.log(
    `${colors.bold}${colors.red}⚠️  FOUND ${duplicateCount} DUPLICATE FALLBACKS! ⚠️${colors.reset}`,
  );
  console.log(
    `${colors.red}These fallback texts are being used with multiple different stringIds${colors.reset}\n`,
  );

  // Sort duplicates by number of occurrences (most problematic first)
  const sortedDuplicates = Object.entries(duplicates).sort(
    (a, b) => b[1].occurrences.length - a[1].occurrences.length,
  );

  for (const [fallback, data] of sortedDuplicates.slice(0, 20)) {
    // Show top 20
    console.log(`${colors.bold}${colors.yellow}⚠️  Fallback: "${fallback}"${colors.reset}`);
    console.log(
      `${colors.cyan}   Used by ${data.stringIds.length} different stringIds:${colors.reset}`,
    );

    for (const stringId of data.stringIds) {
      console.log(`${colors.white}     - ${stringId}${colors.reset}`);
    }

    console.log(`${colors.magenta}   Sample locations (showing first 3):${colors.reset}`);

    for (const occurrence of data.occurrences.slice(0, 3)) {
      const relativePath = occurrence.file.replace(process.cwd() + '/', '');
      console.log(
        `${colors.white}     📁 ${relativePath}:${occurrence.line} (stringId: "${occurrence.stringId}")${colors.reset}`,
      );
    }

    if (data.occurrences.length > 3) {
      console.log(
        `${colors.white}     ... and ${data.occurrences.length - 3} more occurrences${colors.reset}`,
      );
    }

    console.log(''); // Empty line between duplicates
  }

  if (sortedDuplicates.length > 20) {
    console.log(
      `${colors.cyan}... and ${sortedDuplicates.length - 20} more duplicate groups (see JSON report for full details)${colors.reset}\n`,
    );
  }

  // Summary stats
  console.log(`${colors.bold}${colors.blue}📊 ANALYSIS SUMMARY:${colors.reset}`);
  console.log(
    `${colors.cyan}   Total TranslatedText components found: ${allMatches.length}${colors.reset}`,
  );
  console.log(`${colors.yellow}   Duplicate fallback groups: ${duplicateCount}${colors.reset}`);
  const allOccurrences = Object.values(duplicates).reduce(
    (sum, data) => sum + data.occurrences.length,
    0,
  );
  console.log(`${colors.red}   Total problematic occurrences: ${allOccurrences}${colors.reset}`);
  console.log(
    `${colors.magenta}   Unique fallback texts: ${new Set(allMatches.map((m) => m.fallback)).size}${colors.reset}`,
  );
  console.log(
    `${colors.magenta}   Unique stringIds: ${new Set(allMatches.map((m) => m.stringId)).size}${colors.reset}\n`,
  );

  console.log(`${colors.bold}${colors.green}💡 RECOMMENDATIONS:${colors.reset}`);
  console.log(
    `${colors.green}Each fallback should ideally have its own unique stringId for proper translation management.${colors.reset}`,
  );
  console.log(
    `${colors.green}Consider consolidating these into single stringIds or making the fallbacks more specific.${colors.reset}\n`,
  );
}

// Function to save results to file
function saveResultsToFile(duplicates, allMatches) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `duplicate-fallbacks-report-${timestamp}.json`;

  const report = {
    scanDate: new Date().toISOString(),
    summary: {
      totalTranslatedTextComponents: allMatches.length,
      duplicateFallbackGroups: Object.keys(duplicates).length,
      uniqueFallbacks: new Set(allMatches.map((m) => m.fallback)).size,
      uniqueStringIds: new Set(allMatches.map((m) => m.stringId)).size,
    },
    duplicates: duplicates,
    allMatches: allMatches,
  };

  try {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`${colors.bold}${colors.blue}📄 DETAILED REPORT SAVED: ${filename}${colors.reset}`);
    console.log(
      `${colors.cyan}Complete analysis results have been saved for further review${colors.reset}\n`,
    );
  } catch (error) {
    console.log(`${colors.red}❌ Could not save report file: ${error.message}${colors.reset}\n`);
  }
}

// Main execution
console.log(
  `${colors.bold}${colors.green}🚀 Starting enhanced duplicate fallback analysis...${colors.reset}\n`,
);

try {
  const allMatches = scanForTranslatedText();
  const duplicates = findDuplicateFallbacks(allMatches);

  displayResults(duplicates, allMatches);
  saveResultsToFile(duplicates, allMatches);

  console.log(`${colors.bold}${colors.blue}✅ ANALYSIS COMPLETE!${colors.reset}`);
  console.log(
    `${colors.cyan}Your codebase has been thoroughly analyzed for duplicate fallback patterns.${colors.reset}`,
  );

  // Exit with appropriate code
  const duplicateCount = Object.keys(duplicates).length;
  process.exit(duplicateCount > 0 ? 1 : 0);
} catch (error) {
  console.error(`${colors.bold}${colors.red}❌ ANALYSIS FAILED: ${error.message}${colors.reset}`);
  console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
  process.exit(1);
}
