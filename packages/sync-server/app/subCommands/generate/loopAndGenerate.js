import asyncPool from 'tiny-async-pool';

const REPORT_INTERVAL_MS = 100;
const CONCURRENT_GENERATE_CALLS = 4;

function range(n) {
  return Array(n)
    .fill()
    .map((_, i) => i);
}

export async function loopAndGenerate(store, count, generatorFn) {
  let intervalId;
  try {
    let complete = 0;

    let startMs = null;
    const reportProgress = () => {
      // \r works because the length of this is guaranteed to always grow longer or stay the same
      const pct = ((complete / count) * 100).toFixed(2);
      const perSecond = startMs ? (complete / ((Date.now() - startMs) / 1000)).toFixed(2) : '-';
      process.stdout.write(`\rGenerating ${complete}/${count} (${pct}% | ${perSecond}/sec)...`);
    };

    // report progress regularly but don't spam the console
    intervalId = setInterval(reportProgress, REPORT_INTERVAL_MS);
    reportProgress();

    // generate patients
    startMs = Date.now();
    await asyncPool(CONCURRENT_GENERATE_CALLS, range(count), async () => {
      await generatorFn();
      complete++;
    });

    // finish up
    clearInterval(intervalId);
    reportProgress();
    process.stdout.write('\nComplete\n');
  } finally {
    clearInterval(intervalId);
  }
}
