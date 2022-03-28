import { Command } from 'commander';
import COUNTRIES from 'world-countries';
import type { Country } from 'world-countries';

function run (countryName: string, options: {
  dir?: string,
  alpha2?: string,
  alpha3?: string,
  shortname?: string,
  fullname?: string,
  provider?: string,
  deptOrg?: string,
}) {
  console.debug(`Looking up country info for ${countryName}`);
  const country = lookupCountry(countryName);
  const alpha3 = options.alpha3 || country?.cca3;
  const alpha2 = options.alpha2 || country?.cca2;

  const fullCountryName = country?.name.official;
  const shortCountryName = country?.name.common;

  const shortname = options.shortname || `${shortCountryName}HealthCSCA`.replace(/\s+/g, '');
  const fullname = options.fullname || `${fullCountryName} Health CSCA`;
  const provider = options.provider || 'BES';
  const deptOrg = options.deptOrg;

  console.info(`Does this look right?
  alpha3:     ${alpha3}
  alpha2:     ${alpha2}
  short name: ${shortname}
  full name:  ${fullname}
  provider:   ${provider}
  deptOrg:    ${deptOrg || '(none)'}
  `);
}

export default new Command('create')
  .description('creates a new CSCA')
  .argument('country name')
  .option('-d, --dir <path>', 'override the state directory name')
  .option('-2, --alpha-2 <code>', 'override the ISO 3166-1 alpha-2 code')
  .option('-3, --alpha-3 <code>', 'override the ISO 3166-1 alpha-3 code')
  .option('-n, --shortname <name>', 'override the short name of the CSCA (e.g. TamanuHealthCSCA)')
  .option('-N, --fullname <name>', 'override the full name of the CSCA (e.g. "Kingdom of Tamanu Health CSCA")')
  .option('-p, --provider <name>', 'override the provider (O/org field) of the CSCA (defaults to "BES")')
  .option('-d, --dept-org <name>', 'provide the department/organization (OU/org-unit field) of the CSCA (optional, e.g. the full name of the ministry of health)')
  .action(run);

function lookupCountry(name: string): Country|null {
  const nameRx = new RegExp(name, 'i');
  return COUNTRIES.find(c =>
    nameRx.test(c.name.common) ||
    nameRx.test(c.name.official) ||
    nameRx.test(c.cca2) ||
    nameRx.test(c.cca3) ||
    nameRx.test(c.cioc) ||
    Object.values(c.name.native).some(n =>
      nameRx.test(c.name.common) ||
      nameRx.test(c.name.official)
    )
  ) || null;
}
