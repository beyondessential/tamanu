module.exports = function(results) {
  const counts = results.reduce(
    (totals, { errorCount, warningCount, fixableErrorCount, fixableWarningCount }) => ({
      errors: totals.errors + errorCount,
      warnings: totals.warnings + warningCount,
      fixableErrors: totals.fixableErrors + fixableErrorCount,
      fixableWarnings: totals.fixableWarnings + fixableWarningCount,
    }),
    { errors: 0, warnings: 0, fixableErrors: 0, fixableWarnings: 0 },
  );

  return JSON.stringify(counts);
};
