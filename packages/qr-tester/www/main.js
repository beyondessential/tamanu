import { hideElement, showElement } from '/js/dom.js';
import analyse from './js/analysis.js';

const qrdataEl = document.getElementById('qrdata');
const analysisEl = document.getElementById('analysis');

const cscaSelect = document.getElementById('csca_cert_pre');
const cscaFile = document.getElementById('csca_cert_file');
const cscaUrl = document.getElementById('csca_cert_url');

async function analyseData() {
  const csca = cscaSelect.value;
  const data = qrdataEl.value;
  if (data.length) {
    const results = await analyse(data, csca);
    analysisEl.innerHTML = `<ol>${results.map(r => `<li>${r}</li>`).join('\n')}</ol>`;
  } else {
    analysisEl.innerHTML = '';
  }
}

analyseData();

qrdataEl.addEventListener('change', () => analyseData());
qrdataEl.addEventListener('onkeyup', () => analyseData());
qrdataEl.addEventListener('input', () => analyseData());

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

  analyseData();
});

document.getElementById('clearqr').addEventListener('click', () => {
  qrdataEl.value = '';
  analyseData();
  qrdataEl.focus();
});

cscaUrl.querySelector('input').addEventListener('change', () => analyseData());
cscaUrl.querySelector('input').addEventListener('input', () => analyseData());

cscaFile.querySelector('input').addEventListener('change', () => analyseData());
cscaFile.querySelector('input').addEventListener('input', () => analyseData());
