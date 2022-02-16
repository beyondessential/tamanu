const fetch = require('node-fetch');

const hi = [
  'PalauCOVSamp1',
  'PalauCOVSamp2',
  'PalauCOVSamp3',
  'PalauCOVSamp4',
  'PalauCOVSamp44',
  'PalauCOVSamp8',
  'PalauCOVSamp10',
  'PalauCOVSamp11',
  'PalauCOVSamp14',
  'PalauCOVSamp15',
  'PalauCOVSamp20',
  'PalauCOVSamp21',
  'PalauCOVSamp22',
  'PalauCOVSamp23',
  'PalauCOVSamp24',
  'PalauCOVSamp25',
  'PalauCOVSamp26',
  'PalauCOVSamp27',
  'PalauCOVSamp28',
  'PalauCOVSamp29',
  'PalauCOVSamp30',
  'PalauCOVSamp31',
  'PalauCOVSamp33',
  'PalauCOVSamp34',
  'PalauCOVSamp35',
  'PalauCOVSamp36',
  'PalauCOVSamp37',
  'PalauCOVSamp38',
  'PalauCOVSamp39',
  'PalauCOVSamp40',
  'PalauCOVSamp41',
  'PalauCOVSamp42',
];

async function asyncSleep(ms) {
  return new Promise(resolve => {
    // // console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

const token = 'fake-token';

(async () => {
  for (const x of hi) {
    fetch(
      `https://sync.tamanu-palau.org/v1/sync/surveyScreenComponent/program-palaucovid19-palaucovidtestregistrationform-${x}`,
      {
        method: 'DELETE',
        headers: {
          'user-agent': 'vscode-restclient',
          authorization: `Bearer ${token}`,
        },
      },
    )
      .then(response => {
        response.json().then(a => console.log(a));
      })
      .catch(err => {
        console.error(err);
      });
    await asyncSleep(1000);
  }
})();
