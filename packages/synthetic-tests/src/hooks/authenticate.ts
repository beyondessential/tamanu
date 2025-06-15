import { faker } from '@faker-js/faker';

function extractUserIdFromJwt(token: string): string {
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    return payload.userId;
  }
  throw new Error('Invalid JWT token format');
}

function generateNHN() {
  const letters = faker.string.alpha({ length: 4, casing: 'upper' });
  const numbers = faker.string.numeric(6);
  const generatedId = `${letters}${numbers}`;

  return generatedId;
}

export async function generatePatientPayload(context: any, _events: any): Promise<void> {
  const gender = faker.helpers.arrayElement(['male', 'female']);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const dob = faker.date.birthdate({ min: 0, max: 95, mode: 'age' });
  const formattedDOB = dob.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  const nhn = generateNHN();
  const culturalName = faker.person.middleName(gender);
  context.vars.patientPayload = {
    birthFacilityId: null,
    dateOfBirth: formattedDOB,
    displayId: nhn,
    facilityId: context.vars.facilityId,
    firstName: firstName,
    lastName: lastName,
    patientRegistryType: 'new_patient',
    registeredById: context.vars.userId,
    sex: gender,
    villageId: 'village-Dama',
    culturalName: culturalName,
  };
}

export async function authenticate(context: any, _events: any): Promise<void> {
  const { email = 'admin@tamanu.io', password = 'admin' } = context.vars;

  try {
    const response = await fetch(`${context.vars.target}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();

    // console.log('Authentication response:', JSON.stringify(data, null, 2));

    // Extract facility ID from the response
    const facilityId = data.availableFacilities?.[0]?.id || 'facility-a';

    // Extract user ID from JWT token
    const userId = extractUserIdFromJwt(data.token);
    console.log('Extracted userId from JWT:', userId);

    context.vars = {
      ...context.vars,
      token: data.token,
      facilityId: facilityId,
      userId: userId,
    };

    console.log('Stored vars:', { token: data.token, facilityId, userId: context.vars.userId });
  } catch (error) {
    console.error('Authenticate error:', error);
  }
}
