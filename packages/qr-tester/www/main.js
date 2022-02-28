import { showElement, hideElement } from '/js/dom.js';
import Scanner from '/js/scanner.js';

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');

const qrdataEl = document.getElementById('result');

const cscaSelect = document.getElementById('csca_cert_pre');
const cscaFile = document.getElementById('csca_cert_file');
const cscaUrl = document.getElementById('csca_cert_url');

const scanner = new Scanner('canvas');

btnStart.addEventListener('click', () => {
  hideElement(btnStart);
  showElement(btnStop);
  scanner.start((data, ms) => {
    console.log(`QR data received (decoded in ${ms})`, data);
    qrdataEl.innerText = data;
  });
});

btnStop.addEventListener('click', () => {
  hideElement(btnStop);
  showElement(btnStart);
  scanner.stop();
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
