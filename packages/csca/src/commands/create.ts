import { Command } from 'commander';
import COUNTRIES from 'world-countries';
import type { Country } from 'world-countries';
import { enumFromStringValue, enumValues, confirm } from '../utils';
import CA from '../ca';
import { Profile, signerDefaultValidity, signerExtensions, signerWorkingTime } from "../ca/profile";
import { ConfigFile, period } from '../ca/Config';
import { CRL_URL_BASE, CSCA_PKUP, CSCA_VALIDITY } from '../ca/constants';

async function run (countryName: string, options: {
  dir?: string,
  alpha2?: string,
  alpha3?: string,
  shortname?: string,
  fullname?: string,
  provider: string,
  deptOrg?: string,
  profile: string,
}) {
  console.debug(`Looking up country info for ${countryName}`);
  const country = lookupCountry(countryName);
  const alpha3 = options.alpha3 || country?.cca3;
  const alpha2 = options.alpha2 || country?.cca2;

  if (!alpha2 || !alpha3) throw new Error('Country not found or country info incomplete, provide alpha-2 and -3 codes manually');
  if (!/^[A-Z]{2}$/.test(alpha2)) throw new Error('Invalid alpha-2 code');
  if (!/^[A-Z]{3}$/.test(alpha3)) throw new Error('Invalid alpha-3 code');

  const fullCountryName = country?.name.official;
  const shortCountryName = country?.name.common;

  const { deptOrg, provider } = options;
  const profile = enumFromStringValue(Profile, options.profile);

  const shortname = options.shortname || `${shortCountryName}HealthCSCA`.replace(/\s+/g, '');
  const fullname = options.fullname || `${fullCountryName} Health CSCA`;
  const dir = options.dir || `${shortCountryName}.csca`.replace(/\s+/g, '').toLowerCase();

  const ca = new CA(dir);
  if (await ca.exists()) {
    throw new Error(`A CA at ${dir} already exists, not overwriting`);
  }

  const config = makeCAConfig(shortname, fullname, alpha2, alpha3, profile, provider, deptOrg)
  console.info('CSCA Config:', JSON.stringify(config, null, 2));
  await confirm('Proceed?');

  await ca.openReadWrite();
  await ca.create(config);
}

export default new Command('create')
  .description('creates a new CSCA')
  .argument('country name')
  .option('-P, --profile <profile>', `issuance profile to use (one of: ${enumValues(Profile).join(', ')})`, 'vds')
  .option('-d, --dir <path>', 'override the state directory name')
  .option('-2, --alpha-2 <code>', 'override the ISO 3166-1 alpha-2 code')
  .option('-3, --alpha-3 <code>', 'override the ISO 3166-1 alpha-3 code')
  .option('-n, --shortname <name>', 'override the short name of the CSCA (e.g. TamanuHealthCSCA)')
  .option('-N, --fullname <name>', 'override the full name of the CSCA (e.g. "Kingdom of Tamanu Health CSCA")')
  .option('-p, --provider <name>', 'override the provider (O/org field) of the CSCA', 'BES')
  .option('-d, --dept-org <name>', 'provide the department/organization (OU/org-unit field) of the CSCA (optional, e.g. the full name of the ministry of health)')
  .action(run);

function lookupCountry(name: string): undefined | Country {
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
  );
}

function makeCAConfig(
    shortname: string,
    fullname: string,
    countryAlpha2: string,
    countryAlpha3: string,
    profile: Profile,
    provider: undefined | string,
    deptOrg: undefined | string,
  ): ConfigFile {
    const now = new Date();

    const country = {
      alpha2: countryAlpha2,
      alpha3: countryAlpha3,
    };

    return {
      name: shortname,
      country,
      subject: {
        country: countryAlpha2,
        commonName: fullname,
        organisation: provider,
        organisationUnit: deptOrg,
      },
      crl: {
        filename: `${shortname}.crl`,
        distribution: [`${CRL_URL_BASE}/${shortname}.crl`],
        bucket: {
          region: 'ap-southeast-2',
          name: 'crl.tamanu.io',
        },
      },
      workingPeriod: period(now, CSCA_PKUP),
      validityPeriod: period(now, CSCA_VALIDITY),
      issuance: {
        workingPeriodDays: signerWorkingTime(profile).days!,
        validityPeriodDays: signerDefaultValidity(profile).days!,
        extensions: signerExtensions(profile, { country }),
      },
    };
}
