import { showElement, hideElement } from '/js/dom.js';
import Scanner from '/js/scanner.js';
import analyse from './js/analysis.js';

const camStart = document.getElementById('camStart');
const camStop = document.getElementById('camStop');

const qrdataEl = document.getElementById('qrdata');

const cscaSelect = document.getElementById('csca_cert_pre');
const cscaFile = document.getElementById('csca_cert_file');
const cscaUrl = document.getElementById('csca_cert_url');

const scanner = new Scanner('canvas');

async function analyseData() {
  const csca = cscaSelect.value;
  const data = qrdataEl.value;
  if (data.length) {
    const results = await analyse(data, csca);
    const resultEl = document.getElementById('analysis');
    resultEl.innerHTML = `<ol>${results.map(r => `<li>${r}</li>`).join('\n')}</ol>`;
  } else {
    resultEl.innerHTML = '';
  }
}

analyseData();

camStart.addEventListener('click', () => {
  hideElement(camStart);
  showElement(camStop);
  scanner.start((data, ms) => {
    console.log(`QR data received (decoded in ${ms})`, data);
    qrdataEl.innerText = data;
    analyseData();
  });
});

camStop.addEventListener('click', () => {
  hideElement(camStop);
  showElement(camStart);
  scanner.stop();
});

qrdataEl.addEventListener('change', () => {
  analyseData();
});

cscaSelect.addEventListener('input', () => {
  switch (cscaSelect.value) {
    case 'from_url':
      hideElement(cscaFile);
      showElement(cscaUrl);
      break;

    case 'from_file':
      hideElement(cscaUrl);
      showElement(cscaFile);
      break;

    default:
      hideElement(cscaUrl);
      hideElement(cscaFile);
  }
});
