const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const standaloneCode = require('ajv/dist/standalone').default;

const SCHEMATA = {
  VDS_NC: require('./schemata/VDS-NC.json'),
  HEADER: require('./schemata/VDS-NC_header.json'),
  SIGNATURE: require('./schemata/VDS-NC_signature.json'),
  POT: require('./schemata/VDS-NC_message_PoT_ICAO.json'),
  POV: require('./schemata/VDS-NC_message_PoV_WHO.json'),
};

const ajv = new Ajv({
  schemas: Object.values(SCHEMATA),
  strict: true,
  code: { esm: true, lines: true, source: true },
});

const moduleCode = standaloneCode(ajv, {
  VdsNc: SCHEMATA.VDS_NC.$id,
  Header: SCHEMATA.HEADER.$id,
  Signature: SCHEMATA.SIGNATURE.$id,
  PoT: SCHEMATA.POT.$id,
  PoV: SCHEMATA.POV.$id,
})
  .replace(`"use strict";`, `"use strict";\nimport fastDeepEqual from '/js/fastDeepEqual.js';`)
  .replace(`require("ajv/dist/runtime/equal").default`, 'fastDeepEqual');

fs.writeFileSync(path.join(__dirname, 'www/vendor/validateVdsNc.js'), moduleCode);
