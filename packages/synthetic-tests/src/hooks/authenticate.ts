function extractUserIdFromJwt(token: string): string {
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    return payload.userId;
  }
  throw new Error('Invalid JWT token format');
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
  }
}
