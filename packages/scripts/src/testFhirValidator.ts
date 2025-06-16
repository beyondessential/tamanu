#!/usr/bin/env node

import { ExecFileOptions, execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import config from 'config';
import supertest from 'supertest';

import {
  COMMUNICATION_STATUSES,
  IMAGING_REQUEST_STATUS_TYPES,
  JWT_TOKEN_TYPES,
  NOTE_TYPES,
  SERVER_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirEncounter,
} from '@tamanu/central-server/__disttests__/fake/fhir';
import { initDatabase, closeDatabase, initReporting } from '@tamanu/central-server/dist/database';
import { createApp } from '@tamanu/central-server/dist/createApp';
import { initIntegrations } from '@tamanu/central-server/dist/integrations';
import { buildToken } from '@tamanu/central-server/dist/auth/utils';
import { asNewRole } from '@tamanu/shared/test-helpers';
import { DEFAULT_JWT_SECRET } from '@tamanu/central-server/dist/auth';
import { createMockReportingSchemaAndRoles, seedSettings } from '@tamanu/database/demoData';
import { ReadSettings } from '@tamanu/settings';

const TMP_DIR = '/home/rohan/dev/tamanu/tmp/fhir-validator-test';
const DEFAULT_FHIR_IG = 'hl7.fhir.r4b.expansions';

class FhirValidatorTestApplicationContext {
  private readonly closeHooks: (() => Promise<void>)[] = [];
  public store: any;
  private settings: any;
  private reportSchemaStores: any;
  private emailService: any;

  async init() {
    this.store = await initDatabase({ testMode: true });
    this.settings = new ReadSettings(this.store.models);
    await seedSettings(this.store.models);

    if (config.db.reportSchemas?.enabled) {
      await createMockReportingSchemaAndRoles({ sequelize: this.store.sequelize });
      this.reportSchemaStores = await initReporting();
    }
    this.emailService = {
      sendEmail: async () => ({
        status: COMMUNICATION_STATUSES.SENT,
        result: { '//': 'mailgun result not mocked' },
      }),
    };
    await initIntegrations(this);
    return this;
  }

  onClose(hook: () => Promise<void>) {
    this.closeHooks.push(hook);
  }

  close = async () => {
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  };
}

export async function createTestContext() {
  const ctx = await new FhirValidatorTestApplicationContext().init();
  const { models } = ctx.store;
  const { express: expressApp, server: appServer } = await createApp(ctx);
  const baseApp = supertest.agent(appServer);
  baseApp.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);

  baseApp.asUser = async (user) => {
    const agent = supertest.agent(expressApp);
    agent.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);
    const token = await buildToken({ userId: user.id }, DEFAULT_JWT_SECRET, {
      expiresIn: '1d',
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };

  baseApp.asRole = async (role) => {
    const newUser = await models.User.create(fake(models.User, { role }));

    return baseApp.asUser(newUser);
  };

  baseApp.asNewRole = async (permissions = [], roleOverrides = {}) => {
    return asNewRole(baseApp, models, permissions, roleOverrides);
  };

  ctx.onClose(
    () =>
      new Promise((resolve) => {
        appServer.close(resolve);
      }),
  );
  ctx.baseApp = baseApp;

  return ctx;
}

async function runCommandImpl(
  prog: string,
  args: string[],
  opts: ExecFileOptions,
): Promise<string> {
  console.log('$', prog, ...args);
  return execFileSync(prog, args, {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe'],
    ...opts,
  }).trim();
}

let repoRoot: string;
async function findRepoRoot(): Promise<string> {
  if (!repoRoot) {
    const root = await runCommandImpl('npm', ['root'], {});
    console.log('root', root);
    if (!repoRoot) {
      repoRoot = root;
    }
  }

  return repoRoot;
}

async function runCommand(prog: string, args: string[]): Promise<string> {
  return runCommandImpl(prog, args, { cwd: await findRepoRoot() });
}

const checkDatabaseExists = async () => {
  await runCommand(`psql`, [
    `postgresql://${config.db.username}:${config.db.password}@localhost:${config.db.port}/postgres`,
    '-c',
    `DROP DATABASE IF EXISTS "${config.db.name}";`,
  ]);
  await runCommand(`psql`, [
    `postgresql://${config.db.username}:${config.db.password}@localhost:${config.db.port}/postgres`,
    '-c',
    `CREATE DATABASE "${config.db.name}" WITH OWNER = "${config.db.username}";`,
  ]);
};

const checkJavaInstalled = async () => {
  const java = await runCommand('which', ['java']);
  console.log('Java path:', java);
  if (!java) {
    throw new Error('Java is not installed');
  }
};

const checkFhirValidatorInstalled = async () => {
  const checkJarFile = () =>
    runCommand('java', ['-jar', '/home/rohan/dev/tamanu/bin/fhir-validator.jar', '-help']);
  try {
    await checkJarFile();
    return;
  } catch {
    // Ignore error and try to download
  }

  console.log('Downloading fhir-validator');
  await runCommand('mkdir', ['-p', '/home/rohan/dev/tamanu/bin']);
  await runCommand('curl', [
    '-L',
    '-o',
    '/home/rohan/dev/tamanu/bin/fhir-validator.jar',
    'https://github.com/hapifhir/org.hl7.fhir.validator-wrapper/releases/latest/download/validator_cli.jar',
  ]);

  const retryFhirValidator = await checkJarFile();
  if (!retryFhirValidator) {
    throw new Error('Failed to download fhir-validator');
  }
};

const checkTmpDir = async () => {
  await runCommand('mkdir', ['-p', '/home/rohan/dev/tamanu/tmp/fhir-validator-test']);
};

const addResourceToTestFiles = async (app: any, resourceType: string, resourceId: string) => {
  const path = `/api/integration/fhir/mat/${resourceType}/${resourceId}`;
  const response = await app.get(path);

  await fs.writeFile(`${TMP_DIR}/${resourceType}.json`, JSON.stringify(response.body, null, 2));
};

const createPatientTest = async (ctx: any, app: any) => {
  const { FhirPatient, Patient, PatientAdditionalData } = ctx.store.models;
  const patient = await Patient.create(fake(Patient, { dateOfDeath: '2020-01-01' }));
  await PatientAdditionalData.create({
    ...fake(PatientAdditionalData),
    patientId: patient.id,
  });
  await patient.reload(); // saving PatientAdditionalData updates the patient too
  const mat = await FhirPatient.materialiseFromUpstream(patient.id);
  await addResourceToTestFiles(app, 'Patient', mat.id);
};

const createOrganizationTest = async (ctx: any, app: any) => {
  const { Facility, FhirOrganization } = ctx.store.models;
  const facility = await Facility.create(fake(Facility));
  const mat = await FhirOrganization.materialiseFromUpstream(facility.id);
  await addResourceToTestFiles(app, 'Organization', mat.id);
};

const createPractitionerTest = async (ctx: any, app: any) => {
  const { User, FhirPractitioner } = ctx.store.models;
  const user = await User.create(fake(User));
  const mat = await FhirPractitioner.materialiseFromUpstream(user.id);
  await addResourceToTestFiles(app, 'Practitioner', mat.id);
};

const createEncounterTest = async (ctx: any, app: any) => {
  const { Encounter, FhirEncounter } = ctx.store.models;
  const resources = await fakeResourcesOfFhirEncounter(ctx.store.models);
  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: resources.patient.id,
      locationId: resources.location.id,
      departmentId: resources.department.id,
      examinerId: resources.practitioner.id,
    }),
  );
  const mat = await FhirEncounter.materialiseFromUpstream(encounter.id);
  await FhirEncounter.resolveUpstreams();
  await mat.reload();
  await addResourceToTestFiles(app, 'Encounter', mat.id);
};
const createServiceRequestTest = async (ctx: any, app: any) => {
  const resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
  const { FhirPractitioner, FhirOrganization, FhirPatient, FhirEncounter } = ctx.store.models;
  await FhirOrganization.materialiseFromUpstream(resources.facility.id);
  await FhirPatient.materialiseFromUpstream(resources.patient.id);
  await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);
  await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

  const { FhirServiceRequest, ImagingRequest, Note } = ctx.store.models;
  const ir = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: resources.practitioner.id,
      encounterId: resources.encounter.id,
      locationGroupId: resources.locationGroup.id,
      status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: 'xRay',
    }),
  );
  await Note.bulkCreate([
    fake(Note, {
      date: '2022-03-05',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      noteType: NOTE_TYPES.OTHER,
      recordType: ImagingRequest.name,
      recordId: ir.id,
      content: 'Suspected adenoma',
    }),
    fake(Note, {
      date: '2022-03-06',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      noteType: NOTE_TYPES.OTHER,
      recordType: ImagingRequest.name,
      recordId: ir.id,
      content: 'Patient may need mobility assistance',
    }),
  ]);

  await ir.setAreas([resources.area1.id, resources.area2.id]);
  await ir.reload();
  const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
  await FhirServiceRequest.resolveUpstreams();
  await mat.reload();
  await addResourceToTestFiles(app, 'ServiceRequest', mat.id);
};

const validateFiles = async (implementationGuide: string) => {
  try {
    const results = await runCommand('java', [
      '-jar',
      '/home/rohan/dev/tamanu/bin/fhir-validator.jar',
      '-ig',
      implementationGuide,
      `${TMP_DIR}/*.json`,
    ]);
    console.log(results);
    console.log(`✅ Validation passed!`);
  } catch (e) {
    console.log(e.stdout);
    console.log(`❌ Validation failed!`);
  }
};

(async () => {
  const { program } = await import('commander');
  const opts = program
    .option(
      '-ig, --implementation-guide <string>',
      'Which FHIR IG to use for validation',
      DEFAULT_FHIR_IG,
    )
    .parse()
    .opts();

  if (!process.env.NODE_CONFIG_DIR && !opts.skipEnvCheck) {
    throw new Error('NODE_CONFIG_DIR must be set, to select the target server');
  }

  config.db.name = 'fhir-validator-test';

  // Setup
  await checkDatabaseExists();
  await checkJavaInstalled();
  await checkFhirValidatorInstalled();
  await checkTmpDir();
  console.log('✔ Good to go!');

  const ctx = await createTestContext();
  const app = await (ctx as any).baseApp.asRole('practitioner');

  try {
    console.log(`=== Preparation ===`);
    await createPatientTest(ctx, app);
    await createOrganizationTest(ctx, app);
    await createPractitionerTest(ctx, app);
    await createEncounterTest(ctx, app);
    await createServiceRequestTest(ctx, app);

    console.log(`=== Validation ===`);
    await validateFiles(opts.implementationGuide);
  } finally {
    await ctx.close();
  }
})();
