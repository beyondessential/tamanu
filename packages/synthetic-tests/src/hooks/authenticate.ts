import * as jose from 'jose';

function extractUserIdFromJwt(token: string): string {
  try {
    const decoded = jose.decodeJwt(token);
    if (!decoded || !decoded.userId) {
      throw new Error('JWT token does not contain userId');
    }
    return decoded.userId as string;
  } catch (error) {
    throw new Error(`Failed to decode JWT token: ${error.message}`);
  }
}

/**
 * Authenticates the user and stores the token, facility ID, and user ID in context.vars.
 */
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

    // Extract facility ID from the response
    const facilityId = data.availableFacilities?.[0]?.id || 'facility-a';

    // Extract user ID from JWT token
    const userId = extractUserIdFromJwt(data.token);

    context.vars = {
      ...context.vars,
      token: data.token,
      facilityId: facilityId,
      userId: userId,
    };
  } catch (error) {
    console.error('Authenticate error:', error);
    throw error;
  }
}
