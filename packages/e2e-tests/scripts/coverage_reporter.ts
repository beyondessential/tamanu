const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Load regression tests
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

  return records
    .filter(record => record['Test'] && record['Test'].trim() !== '')
    .map(record => {
      const automatedIdsStr = record['Automated Test IDs'] || '';
      const automatedTestIds = automatedIdsStr
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');

      return {
        testId: record['Test ID'] || '',
        testName: record['Test'].trim(),
        automatedTestIds
      };
    });
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

// Scan Playwright tests - FIXED VERSION
function scanPlaywrightTests(testsDirectory) {
  const testFiles = getTestFiles(testsDirectory);
  const playwrightTests = [];

  console.log(`\nScanning ${testFiles.length} test files...`);

  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      // Match test declarations with any combination of T-IDs and AT-IDs
      // Pattern 1: test('[T-0001][AT-0001] description', ...)
      // Pattern 2: test('[AT-0001] description', ...)
      // Pattern 3: test.skip('[AT-0001] description', ...)
      
      const testMatch = /test(?:\.only|\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]/.exec(line);
      
      if (testMatch) {
        const fullTestName = testMatch[1];
        
        // Extract all T-IDs
        const tIdMatches = fullTestName.match(/\[T-\d{4}\]/g);
        const regressionTestIds = tIdMatches 
          ? tIdMatches.map(match => match.replace(/[\[\]]/g, ''))
          : [];
        
        // Extract AT-ID
        const atIdMatch = fullTestName.match(/\[AT-\d{4}\]/);
        const automatedTestId = atIdMatch ? atIdMatch[0].replace(/[\[\]]/g, '') : '';
        
        if (automatedTestId) {
          // Extract the actual test description (everything after the IDs)
          const testName = fullTestName
            .replace(/\[T-\d{4}\]/g, '')  // Remove all T-IDs
            .replace(/\[AT-\d{4}\]/g, '') // Remove AT-ID
            .trim();
          
          playwrightTests.push({
            automatedTestId,
            regressionTestIds,
            testName,
            file: path.basename(file),
            fullTestName: fullTestName,
            lineNumber: lineNum + 1
          });
          
          // Debug output
          console.log(`  Found: ${automatedTestId} ${regressionTestIds.length > 0 ? `→ ${regressionTestIds.join(', ')}` : '(orphaned)'} in ${path.basename(file)}:${lineNum + 1}`);
        }
      }
    });
  });

  return playwrightTests;
}

// Generate report
function generateReport(regressionTests, playwrightTests) {
  const totalRegression = regressionTests.length;
  const totalPlaywright = playwrightTests.length;

  // Calculate automated
  const automatedTests = regressionTests.filter(regTest => {
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

  console.log(`\n📊 Orphaned Tests Analysis:`);
  console.log(`  Total Playwright tests: ${totalPlaywright}`);
  console.log(`  Tests with regression IDs: ${totalPlaywright - orphanedTests.length}`);
  console.log(`  Orphaned tests: ${orphanedTests.length}`);
  
  if (orphanedTests.length > 0) {
    console.log(`\n  Orphaned test details:`);
    orphanedTests.forEach(test => {
      console.log(`    - ${test.automatedTestId}: ${test.testName} (${test.file}:${test.lineNumber})`);
    });
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  TEST COVERAGE SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Regression Tests:    ${totalRegression}`);
  console.log(`Fully Automated:           ${fullyAutomated}`);
  console.log(`Not Automated:             ${notAutomated}`);
  console.log(`\nPlaywright Tests:          ${totalPlaywright}`);
  console.log(`Orphaned Tests:            ${orphanedTests.length}`);
  console.log(`\nOverall Coverage:          ${coveragePercent}%`);
  console.log('='.repeat(60) + '\n');

  return { fullyAutomated, notAutomated, totalRegression, totalPlaywright, orphanedTests, coveragePercent };
}

// Generate HTML
function generateHTML(stats) {
  const { fullyAutomated, notAutomated, totalRegression, totalPlaywright, orphanedTests, coveragePercent } = stats;
  
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
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test Coverage Report</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px; margin: 0; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header p { color: #64748b; margin-top: 10px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; border-radius: 16px 16px 0 0; }
    .stat-card.total::before { background: linear-gradient(90deg, #667eea, #764ba2); }
    .stat-card.automated::before { background: linear-gradient(90deg, #10b981, #059669); }
    .stat-card.manual::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .stat-card.playwright::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .stat-card.coverage::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .stat-card.orphaned::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
    .stat-label { font-size: 0.9em; color: #64748b; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; }
    .stat-number { font-size: 4em; font-weight: 800; color: #1e293b; line-height: 1; }
    .stat-sublabel { font-size: 0.9em; color: #94a3b8; margin-top: 12px; }
    .progress-bar { width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 15px; }
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
    .alert strong { display: block; margin-bottom: 8px; font-size: 1.15em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Test Coverage Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
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
        <div class="stat-sublabel">Total automated tests</div>
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
  </div>
</body>
</html>`;

  fs.writeFileSync('./coverage-report.html', html);
  console.log('✓ HTML report generated: coverage-report.html');
}

// ==================== RUN ====================

const CSV_PATH = './testcases.csv';
const TESTS_DIR = './tests';  // Update if your tests are elsewhere

console.log('🚀 Starting Coverage Analysis...\n');

const regressionTests = loadRegressionTests(CSV_PATH);
console.log(`✓ Loaded ${regressionTests.length} regression tests`);

const playwrightTests = scanPlaywrightTests(TESTS_DIR);
console.log(`✓ Found ${playwrightTests.length} Playwright tests total`);

const stats = generateReport(regressionTests, playwrightTests);
generateHTML(stats);

// Add this after the scanPlaywrightTests call, before generateReport
console.log('\n📋 Checking for duplicate AT-IDs...');
const atIdCounts = {};
playwrightTests.forEach(test => {
  atIdCounts[test.automatedTestId] = (atIdCounts[test.automatedTestId] || 0) + 1;
});

const duplicates = Object.entries(atIdCounts)
  .filter(([id, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);

if (duplicates.length > 0) {
  console.log(`⚠️  Found ${duplicates.length} duplicate AT-IDs:`);
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