import config from 'config';
import { fetch } from 'undici';

import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

const GRAPHQL_ENDPOINT = '/graphql';

const AUTH_QUERY = `
  query Auth($password: String!, $username: String!) {
    authToken(password: $password, username: $username) {
      ... on AuthToken {
        __typename
        token
      }
      ... on AuthTokenError {
        __typename
        error {
          description
        }
      }
    }
  }
`;

export class MSupplyClient {
  constructor(context) {
    this.context = context;
  }

  async getSettings(facilityId) {
    const integrationSettings = await this.context.settings[facilityId]?.get(
      'integrations.mSupplyMed',
    );
    return integrationSettings ?? {};
  }

  async authenticate(facilityId) {
    const { host, backoff } = await this.getSettings(facilityId);
    const { username, password } = config.integrations.mSupplyMed;

    const response = await fetchWithRetryBackoff(
      `${host}${GRAPHQL_ENDPOINT}`,
      {
        fetch,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: AUTH_QUERY, variables: { username, password } }),
      },
      { ...backoff, log },
    );

    const { data } = await response.json();
    const token = data?.authToken?.token;
    if (!token) {
      throw new Error('mSupply authentication failed: no token returned');
    }
    return token;
  }

  async graphqlQuery({ host, query, variables, authToken, backoff }) {
    const response = await fetchWithRetryBackoff(
      `${host}${GRAPHQL_ENDPOINT}`,
      {
        fetch,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ query, ...(variables && { variables }) }),
      },
      { ...backoff, log },
    );

    return response.json();
  }
}
