const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Load regression tests with module grouping
function loadRegressionTests(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  let currentModule = 'Uncategorized';
  const testsByModule = {};
  const allTests = [];

  records.forEach(record => {
    const testName = record['Test'] ? record['Test'].trim() : '';
    const testId = record['Test ID'] ? record['Test ID'].trim() : '';
    
    if (!testName) return;

    // Detect module header: has Test name but no Test ID (or invalid Test ID format)
    const isModuleHeader = testName && (!testId || !testId.match(/^T-\d{4}$/));
    
    if (isModuleHeader) {
      currentModule = testName;
      if (!testsByModule[currentModule]) {
        testsByModule[currentModule] = [];
      }
      console.log(`📁 Found module: ${currentModule}`);
      return;
    }

    // This is an actual test case
    if (testId && testId.match(/^T-\d{4}$/)) {
      const automatedIdsStr = record['Automated Test IDs'] || '';
      const automatedTestIds = automatedIdsStr
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');

      const testData = {
        testId,
        testName,
        automatedTestIds,
        module: currentModule
      };

      allTests.push(testData);
      
      if (!testsByModule[currentModule]) {
        testsByModule[currentModule] = [];
      }
      testsByModule[currentModule].push(testData);
    }
  });

  return { allTests, testsByModule };
}

// Get test files
function getTestFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getTestFiles(filePath, fileList);
      } else if (file.match(/\.(spec|test)\.(ts|js|tsx|jsx)$/)) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip
    }
  });
  return fileList;
}

// Scan Playwright tests
function scanPlaywrightTests(testsDirectory) {
  const testFiles = getTestFiles(testsDirectory);
  const playwrightTests = [];

  console.log(`\nScanning ${testFiles.length} test files...`);

  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      const testMatch = /test(?:\.only|\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]/.exec(line);
      
      if (testMatch) {
        const fullTestName = testMatch[1];
        
        // Extract all T-IDs (supports T-0001 format)
        const tIdMatches = fullTestName.match(/\[T-\d{4}\]/g);
        const regressionTestIds = tIdMatches 
          ? tIdMatches.map(match => match.replace(/[\[\]]/g, ''))
          : [];
        
        // Extract AT-ID (supports both AT-001 and AT-0001 formats)
        const atIdMatch = fullTestName.match(/\[AT-\d{3,4}\]/);
        let automatedTestId = atIdMatch ? atIdMatch[0].replace(/[\[\]]/g, '') : '';
        
        // Normalize AT-ID to 4-digit format (AT-116 -> AT-0116)
        if (automatedTestId && automatedTestId.match(/^AT-\d{3}$/)) {
          const number = automatedTestId.split('-')[1];
          automatedTestId = `AT-${number.padStart(4, '0')}`;
        }
        
        if (automatedTestId) {
          const testName = fullTestName
            .replace(/\[T-\d{4}\]/g, '')
            .replace(/\[AT-\d{4}\]/g, '')
            .trim();
          
          playwrightTests.push({
            automatedTestId,
            regressionTestIds,
            testName,
            file: path.basename(file),
            fullTestName: fullTestName,
            lineNumber: lineNum + 1
          });
        }
      }
    });
  });

  return playwrightTests;
}

// Analyze duplicate AT-IDs
function analyzeDuplicateATIds(playwrightTests) {
  const atIdCounts = {};
  playwrightTests.forEach(test => {
    atIdCounts[test.automatedTestId] = (atIdCounts[test.automatedTestId] || 0) + 1;
  });

  const duplicates = Object.entries(atIdCounts)
    .filter(([id, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate AT-IDs:`);
    duplicates.forEach(([id, count]) => {
      console.log(`  ${id}: used ${count} times`);
      const locations = playwrightTests
        .filter(t => t.automatedTestId === id)
        .map(t => `${t.file}:${t.lineNumber}`);
      locations.forEach(loc => console.log(`    - ${loc}`));
    });
  }

  const uniqueATIds = Object.keys(atIdCounts).length;
  console.log(`\n✓ Unique AT-IDs: ${uniqueATIds}`);
  console.log(`✓ Total test declarations: ${playwrightTests.length}`);
  
  return { uniqueATIds, duplicates };
}

// Calculate module statistics
function calculateModuleStats(testsByModule, playwrightTests, debug = false) {
  const moduleStats = {};

  Object.entries(testsByModule).forEach(([moduleName, tests]) => {
    const totalTests = tests.length;
    
    const automatedTests = tests.filter(regTest => {
      const isAutomated = playwrightTests.some(pwTest =>
        regTest.automatedTestIds.includes(pwTest.automatedTestId) ||
        pwTest.regressionTestIds.includes(regTest.testId)
      );
      
      // Debug specific module
      if (debug && moduleName.toLowerCase().includes('outpatient')) {
        console.log(`\n  Checking: ${regTest.testId} - ${regTest.testName}`);
        console.log(`    CSV Automated IDs: [${regTest.automatedTestIds.join(', ')}]`);
        
        const matchingPwTests = playwrightTests.filter(pwTest =>
          regTest.automatedTestIds.includes(pwTest.automatedTestId) ||
          pwTest.regressionTestIds.includes(regTest.testId)
        );
        
        if (matchingPwTests.length > 0) {
          console.log(`    ✓ MATCHED with:`);
          matchingPwTests.forEach(pw => {
            console.log(`      - ${pw.automatedTestId} [${pw.regressionTestIds.join(', ')}]`);
          });
        } else {
          console.log(`    ✗ NO MATCH FOUND`);
          
          // Show potential matches
          const potentialMatches = playwrightTests.filter(pw => 
            pw.testName.toLowerCase().includes(regTest.testName.toLowerCase().slice(0, 20)) ||
            regTest.testName.toLowerCase().includes(pw.testName.toLowerCase().slice(0, 20))
          );
          
          if (potentialMatches.length > 0) {
            console.log(`    💡 Potential matches by name:`);
            potentialMatches.forEach(pw => {
              console.log(`      - ${pw.automatedTestId} [${pw.regressionTestIds.join(', ')}]: ${pw.testName.slice(0, 60)}`);
            });
          }
        }
      }
      
      return isAutomated;
    });

    const automated = automatedTests.length;
    const notAutomated = totalTests - automated;
    const coverage = totalTests > 0 ? ((automated / totalTests) * 100).toFixed(1) : '0';

    moduleStats[moduleName] = {
      total: totalTests,
      automated,
      notAutomated,
      coverage: parseFloat(coverage),
      automatedTests
    };
  });

  return moduleStats;
}

// Generate report
function generateReport(allTests, testsByModule, playwrightTests) {
  const totalRegression = allTests.length;
  const totalPlaywright = playwrightTests.length;

  // Calculate automated
  const automatedTests = allTests.filter(regTest => {
    return playwrightTests.some(pwTest =>
      regTest.automatedTestIds.includes(pwTest.automatedTestId) ||
      pwTest.regressionTestIds.includes(regTest.testId)
    );
  });

  const fullyAutomated = automatedTests.length;
  const notAutomated = totalRegression - fullyAutomated;
  const coveragePercent = totalRegression > 0 
    ? ((fullyAutomated / totalRegression) * 100).toFixed(1)
    : '0';

  // Find orphaned
  const orphanedTests = playwrightTests.filter(pwTest => 
    pwTest.regressionTestIds.length === 0
  );

  // Analyze duplicates
  const { uniqueATIds, duplicates } = analyzeDuplicateATIds(playwrightTests);

  // Calculate module stats with debugging for Outpatients
  console.log('\n🔍 Debugging "All patients > Outpatients" module...');
  const moduleStats = calculateModuleStats(testsByModule, playwrightTests, true);

  // Show specific module details
  const outpatientModule = Object.entries(testsByModule).find(([name]) => 
    name.includes('Outpatient')
  );
  
  if (outpatientModule) {
    const [moduleName, tests] = outpatientModule;
    console.log(`\n📋 Found module: "${moduleName}"`);
    console.log(`   Total tests in this module: ${tests.length}`);
    console.log(`   Test IDs in this module:`);
    tests.forEach(test => {
      const atIds = test.automatedTestIds.length > 0 
        ? `[${test.automatedTestIds.join(', ')}]` 
        : '[NONE]';
      console.log(`     ${test.testId}: ${test.testName}`);
      console.log(`       → Automated Test IDs in CSV: ${atIds}`);
    });
  }

  // Show all Playwright tests for debugging
  console.log('\n📝 All Playwright tests with "outpatient" in name:');
  playwrightTests
    .filter(pw => pw.testName.toLowerCase().includes('outpatient') || pw.file.toLowerCase().includes('outpatient'))
    .forEach(pw => {
      console.log(`  ${pw.automatedTestId} [T-IDs: ${pw.regressionTestIds.join(', ') || 'none'}]`);
      console.log(`    File: ${pw.file}:${pw.lineNumber}`);
      console.log(`    Name: ${pw.testName}`);
    });

  // Print module breakdown
  console.log('\n' + '='.repeat(80));
  console.log('  MODULE BREAKDOWN');
  console.log('='.repeat(80));
  
  Object.entries(moduleStats)
    .sort((a, b) => b[1].coverage - a[1].coverage)
    .forEach(([module, stats]) => {
      console.log(`\n📦 ${module}`);
      console.log(`   Total: ${stats.total} | Automated: ${stats.automated} | Coverage: ${stats.coverage}%`);
    });

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('  OVERALL TEST COVERAGE SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Regression Tests:    ${totalRegression}`);
  console.log(`Fully Automated:           ${fullyAutomated}`);
  console.log(`Not Automated:             ${notAutomated}`);
  console.log(`\nPlaywright Tests:          ${totalPlaywright}`);
  console.log(`Unique AT-IDs:             ${uniqueATIds}`);
  console.log(`Duplicate AT-IDs:          ${duplicates.length}`);
  console.log(`Orphaned Tests:            ${orphanedTests.length}`);
  console.log(`\nOverall Coverage:          ${coveragePercent}%`);
  console.log('='.repeat(80) + '\n');

  return { 
    fullyAutomated, 
    notAutomated, 
    totalRegression, 
    totalPlaywright, 
    uniqueATIds,
    orphanedTests, 
    coveragePercent,
    moduleStats,
    duplicates
  };
}

// Generate HTML
function generateHTML(stats) {
  const { 
    fullyAutomated, 
    notAutomated, 
    totalRegression, 
    totalPlaywright, 
    uniqueATIds,
    orphanedTests, 
    coveragePercent,
    moduleStats,
    duplicates
  } = stats;
  
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // Format date and time using system locale and timezone
  // Use TZ environment variable if set, otherwise default to Melbourne
  // To override: Set TZ environment variable, e.g.: TZ='America/New_York' npm run coverage
  const timeZone = process.env.TZ || 'Australia/Melbourne';
  const generatedDate = new Date().toLocaleString(undefined, { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone
  });
  
  // Get friendly timezone name
  const timeZoneName = timeZone === 'Australia/Melbourne' ? 'Melbourne time' : timeZone.replace(/_/g, ' ');

  // Sort modules by coverage
  const sortedModules = Object.entries(moduleStats)
    .sort((a, b) => b[1].coverage - a[1].coverage);
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test Coverage Report</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px; margin: 0; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header p { color: #64748b; margin-top: 10px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; border-radius: 16px 16px 0 0; }
    .stat-card.total::before { background: linear-gradient(90deg, #667eea, #764ba2); }
    .stat-card.automated::before { background: linear-gradient(90deg, #10b981, #059669); }
    .stat-card.manual::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .stat-card.playwright::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .stat-card.coverage::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .stat-card.orphaned::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
    .stat-card.unique::before { background: linear-gradient(90deg, #06b6d4, #0891b2); }
    .stat-label { font-size: 0.85em; color: #64748b; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-number { font-size: 3.5em; font-weight: 800; color: #1e293b; line-height: 1; }
    .stat-sublabel { font-size: 0.85em; color: #94a3b8; margin-top: 10px; }
    .progress-bar { width: 100%; height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden; margin-top: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); transition: width 0.8s ease; }
    .section { background: white; padding: 35px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .section h2 { font-size: 1.75em; color: #1e293b; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
    thead { background: #f8fafc; }
    th { padding: 16px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody tr:hover { background: #f8fafc; }
    .test-id { font-family: 'Courier New', monospace; font-weight: 700; color: #667eea; background: #f0f4ff; padding: 4px 10px; border-radius: 6px; font-size: 0.9em; }
    .test-name { font-weight: 600; color: #1e293b; }
    .test-file { font-size: 0.85em; color: #64748b; font-family: 'Courier New', monospace; margin-top: 4px; }
    .alert { padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid; }
    .alert.info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert.success { background: #f0fdf4; border-color: #10b981; color: #065f46; }
    .alert.warning { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
    .alert strong { display: block; margin-bottom: 8px; font-size: 1.15em; }
    .module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-top: 25px; }
    .module-card { background: #f8fafc; padding: 24px; border-radius: 12px; border-left: 5px solid; transition: transform 0.2s, box-shadow 0.2s; }
    .module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    .module-card.high { border-color: #10b981; }
    .module-card.medium { border-color: #f59e0b; }
    .module-card.low { border-color: #ef4444; }
    .module-name { font-size: 1.1em; font-weight: 700; color: #1e293b; margin-bottom: 15px; }
    .module-stats { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .module-stat { font-size: 0.9em; color: #64748b; }
    .module-stat strong { color: #1e293b; font-size: 1.1em; }
    .module-coverage { font-size: 2em; font-weight: 800; text-align: right; }
    .module-coverage.high { color: #10b981; }
    .module-coverage.medium { color: #f59e0b; }
    .module-coverage.low { color: #ef4444; }
    .module-progress { width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
    .module-progress-fill { height: 100%; transition: width 0.6s ease; }
    .module-progress-fill.high { background: linear-gradient(90deg, #10b981, #059669); }
    .module-progress-fill.medium { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .module-progress-fill.low { background: linear-gradient(90deg, #ef4444, #dc2626); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Test Coverage Report</h1>
      <p>Generated: ${generatedDate} (${timeZoneName})</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <div class="stat-label">Total Regression Tests</div>
        <div class="stat-number">${totalRegression}</div>
        <div class="stat-sublabel">All test cases</div>
      </div>
      <div class="stat-card automated">
        <div class="stat-label">Fully Automated</div>
        <div class="stat-number">${fullyAutomated}</div>
        <div class="stat-sublabel">${((fullyAutomated / totalRegression) * 100).toFixed(1)}% automated</div>
      </div>
      <div class="stat-card manual">
        <div class="stat-label">Not Automated</div>
        <div class="stat-number">${notAutomated}</div>
        <div class="stat-sublabel">${((notAutomated / totalRegression) * 100).toFixed(1)}% manual</div>
      </div>
      <div class="stat-card playwright">
        <div class="stat-label">Playwright Tests</div>
        <div class="stat-number">${totalPlaywright}</div>
        <div class="stat-sublabel">Total test declarations</div>
      </div>
      <div class="stat-card unique">
        <div class="stat-label">Unique AT-IDs</div>
        <div class="stat-number">${uniqueATIds}</div>
        <div class="stat-sublabel">${duplicates.length} duplicates found</div>
      </div>
      <div class="stat-card coverage">
        <div class="stat-label">Overall Coverage</div>
        <div class="stat-number">${coveragePercent}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${coveragePercent}%"></div>
        </div>
      </div>
      <div class="stat-card orphaned">
        <div class="stat-label">Orphaned Tests</div>
        <div class="stat-number">${orphanedTests.length}</div>
        <div class="stat-sublabel">Not mapped to regression</div>
      </div>
    </div>

    ${duplicates.length > 0 ? `
    <div class="alert warning">
      <strong>⚠️ ${duplicates.length} Duplicate AT-IDs Detected</strong>
      <p>The same automation test ID is used in multiple test declarations. This may indicate copy-paste errors or tests that should be consolidated.</p>
    </div>
    ` : ''}

    <div class="section">
      <h2>📊 Coverage by Module</h2>
      <div class="module-grid">
        ${sortedModules.map(([module, stats]) => {
          const coverageClass = stats.coverage >= 70 ? 'high' : stats.coverage >= 40 ? 'medium' : 'low';
          return `
            <div class="module-card ${coverageClass}">
              <div class="module-name">${escapeHtml(module)}</div>
              <div class="module-stats">
                <div>
                  <div class="module-stat"><strong>${stats.automated}</strong> / ${stats.total} automated</div>
                  <div class="module-stat" style="margin-top: 4px;">${stats.notAutomated} remaining</div>
                </div>
                <div class="module-coverage ${coverageClass}">${stats.coverage}%</div>
              </div>
              <div class="module-progress">
                <div class="module-progress-fill ${coverageClass}" style="width: ${stats.coverage}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="section">
      <h2>📈 Module Statistics Table</h2>
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th style="text-align: center;">Total Tests</th>
            <th style="text-align: center;">Automated</th>
            <th style="text-align: center;">Not Automated</th>
            <th style="text-align: center;">Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${sortedModules.map(([module, stats]) => {
            const coverageClass = stats.coverage >= 70 ? 'high' : stats.coverage >= 40 ? 'medium' : 'low';
            return `
              <tr>
                <td><strong>${escapeHtml(module)}</strong></td>
                <td style="text-align: center;">${stats.total}</td>
                <td style="text-align: center; color: #10b981; font-weight: 600;">${stats.automated}</td>
                <td style="text-align: center; color: #ef4444; font-weight: 600;">${stats.notAutomated}</td>
                <td style="text-align: center;">
                  <span style="font-weight: 700; font-size: 1.1em;" class="module-coverage ${coverageClass}">${stats.coverage}%</span>
                </td>
              </tr>
            `;
          }).join('')}
          <tr style="background: #f1f5f9; font-weight: 700;">
            <td><strong>TOTAL</strong></td>
            <td style="text-align: center;">${totalRegression}</td>
            <td style="text-align: center; color: #10b981;">${fullyAutomated}</td>
            <td style="text-align: center; color: #ef4444;">${notAutomated}</td>
            <td style="text-align: center; font-size: 1.2em;">${coveragePercent}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${orphanedTests.length > 0 ? `
    <div class="alert info">
      <strong>💡 ${orphanedTests.length} Orphaned Playwright Tests</strong>
      <p>These automated tests are not mapped to any regression test. Review them to decide if they should be added to the regression spreadsheet.</p>
    </div>

    <div class="section">
      <h2>🔍 Orphaned Playwright Tests</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Test ID</th>
            <th style="width: 50%;">Test Name</th>
            <th style="width: 35%;">File Location</th>
          </tr>
        </thead>
        <tbody>
          ${orphanedTests.map(test => `
            <tr>
              <td><span class="test-id">${escapeHtml(test.automatedTestId)}</span></td>
              <td>
                <div class="test-name">${escapeHtml(test.testName)}</div>
                <div style="font-size: 0.85em; color: #94a3b8; margin-top: 4px;">${escapeHtml(test.fullTestName)}</div>
              </td>
              <td><div class="test-file">${escapeHtml(test.file)}:${test.lineNumber}</div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : `
    <div class="alert success">
      <strong>✅ All Tests Mapped</strong>
      <p>All Playwright tests are properly mapped to regression test cases. Great work!</p>
    </div>
    `}

    ${duplicates.length > 0 ? `
    <div class="section">
      <h2>⚠️ Duplicate AT-IDs</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">AT-ID</th>
            <th style="width: 15%;">Usage Count</th>
            <th style="width: 65%;">Locations</th>
          </tr>
        </thead>
        <tbody>
          ${duplicates.map(([id, count]) => `
            <tr>
              <td><span class="test-id">${escapeHtml(id)}</span></td>
              <td style="text-align: center; font-weight: 700; color: #f59e0b;">${count}x</td>
              <td>
                ${stats.playwrightTests
                  .filter(t => t.automatedTestId === id)
                  .map(t => `<div class="test-file">${escapeHtml(t.file)}:${t.lineNumber}</div>`)
                  .join('')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>
</body>
</html>`;

  fs.writeFileSync('./coverage-report.html', html);
  console.log('✓ HTML report generated: coverage-report.html');
}

// ==================== RUN ====================

const CSV_PATH = './testcases.csv';
const TESTS_DIR = './tests';

console.log('🚀 Starting Coverage Analysis...\n');

const { allTests, testsByModule } = loadRegressionTests(CSV_PATH);
console.log(`✓ Loaded ${allTests.length} regression tests`);
console.log(`✓ Found ${Object.keys(testsByModule).length} modules`);

// Show all module names for verification
console.log('\n📋 Detected modules:');
Object.entries(testsByModule).forEach(([moduleName, tests]) => {
  console.log(`  - "${moduleName}" (${tests.length} tests)`);
});

const playwrightTests = scanPlaywrightTests(TESTS_DIR);
console.log(`✓ Found ${playwrightTests.length} Playwright tests total`);

const stats = generateReport(allTests, testsByModule, playwrightTests);
stats.playwrightTests = playwrightTests; // Add for duplicate reporting
generateHTML(stats);