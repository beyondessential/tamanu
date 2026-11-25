import { faker } from '@faker-js/faker';
import { addDays, format } from 'date-fns';
import pg from 'pg';
import 'dotenv/config';

import {
  PORTAL_ONE_TIME_TOKEN_TYPES,
  PORTAL_SURVEY_ASSIGNMENTS_STATUSES,
  PORTAL_USER_STATUSES,
} from '@tamanu/constants';

import { generateNHN } from './generateNewPatient';

// Arranges patient portal state directly in the central database. The portal reads only from
// central, central has no staff API that creates patients, and the E2E servers don't sync facility
// data up while specs run, so this is the one place the suite writes to a database.

// Defaults to the database CI provisions; set CENTRAL_DATABASE_URL in .env for a local run.
const centralDatabaseUrl =
  process.env.CENTRAL_DATABASE_URL ?? 'postgres://tamanu:tamanu@localhost:5432/central';

/** The code a portal patient signs in with, once `issuePortalLoginCode` has issued it. */
export const PORTAL_LOGIN_CODE = '424242';
// PORTAL_LOGIN_CODE hashed with bcrypt, as central stores the codes it emails
const PORTAL_LOGIN_CODE_HASH = '$2b$10$2e2kEu/HX8KUIKeQYKsLt.3.HM9LP.KqNHGS1KnE0ecr6XydZOMX.';

// Datetime columns hold the primary time zone's wall time, which TZ matches in E2E runs
const toStoredDateTime = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss');

const withCentralDatabase = async <T>(run: (client: pg.Client) => Promise<T>): Promise<T> => {
  const client = new pg.Client({ connectionString: centralDatabaseUrl });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
};

export type PortalPatient = {
  id: string;
  portalUserId: string;
  displayId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
};

/** A patient on central with a portal account they have finished registering. */
export const createPortalPatient = async (): Promise<PortalPatient> => {
  const sex = faker.helpers.arrayElement(['female', 'male'] as const);
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();
  const displayId = generateNHN();
  const dateOfBirth = format(faker.date.birthdate(), 'yyyy-MM-dd');
  const email = `${displayId.toLowerCase()}@e2e.tamanu.io`;

  return withCentralDatabase(async client => {
    const { rows } = await client.query(
      `WITH patient AS (
        INSERT INTO patients (display_id, first_name, last_name, date_of_birth, sex)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      )
      INSERT INTO portal_users (patient_id, email, status)
      SELECT id, $6, $7 FROM patient
      RETURNING id, patient_id`,
      [displayId, firstName, lastName, dateOfBirth, sex, email, PORTAL_USER_STATUSES.REGISTERED],
    );
    const [{ id: portalUserId, patient_id: id }] = rows;
    return { id, portalUserId, displayId, firstName, lastName, dateOfBirth, email };
  });
};

/**
 * Replaces the login code central last emailed the patient with `PORTAL_LOGIN_CODE`. Call it after
 * asking for a code, since asking replaces any code already issued.
 */
export const issuePortalLoginCode = async (portalUserId: string) =>
  withCentralDatabase(async client => {
    await client.query(
      'DELETE FROM portal_one_time_tokens WHERE portal_user_id = $1 AND type = $2',
      [portalUserId, PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN],
    );
    await client.query(
      `INSERT INTO portal_one_time_tokens (portal_user_id, type, token, expires_at)
      VALUES ($1, $2, $3, $4)`,
      [
        portalUserId,
        PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN,
        PORTAL_LOGIN_CODE_HASH,
        toStoredDateTime(addDays(new Date(), 1)),
      ],
    );
    return PORTAL_LOGIN_CODE;
  });

/** Sends the patient a form to fill in from the portal, as the E2E test user. */
export const assignPortalForm = async ({
  patientId,
  surveyId,
  facilityId,
}: {
  patientId: string;
  surveyId: string;
  facilityId: string;
}) =>
  withCentralDatabase(async client => {
    const { rowCount } = await client.query(
      `INSERT INTO portal_survey_assignments
        (patient_id, survey_id, facility_id, status, assigned_by_id, assigned_at)
      SELECT $1, $2, $3, $4, id, $5 FROM users WHERE email = $6`,
      [
        patientId,
        surveyId,
        facilityId,
        PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        toStoredDateTime(new Date()),
        process.env.TEST_EMAIL,
      ],
    );
    if (rowCount !== 1) {
      throw new Error(`No user ${process.env.TEST_EMAIL} on central to assign the form`);
    }
  });
