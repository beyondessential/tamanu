import React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ApiContext } from '@tamanu/ui-components';
import { type Endpoint, resolveEndpoint } from '@tamanu/api-client';
import { TranslationProvider } from '../src/contexts';
import { PrivateRoute } from '../src/routes/PrivateRoute';
import { PublicRoute } from '../src/routes/PublicRoute';

export const fakePatient = (overrides = {}) => ({
  id: 'patient-kamaka',
  displayId: 'KAMAKA01',
  firstName: 'Ana',
  lastName: 'Kamaka',
  dateOfBirth: '1990-05-15',
  sex: 'female',
  email: 'ana@example.com',
  additionalData: {},
  ...overrides,
});

type Responses = Record<string, unknown>;

/** A stand-in for the portal's API, answering GETs by endpoint. */
export const createFakeApi = (responses: Responses) => ({
  get: vi.fn(async (endpoint: Endpoint) => {
    const path = resolveEndpoint(endpoint);
    if (path in responses) return responses[path];
    if (path.startsWith('suggestions/')) return [];
    throw Object.assign(new Error(`No fake response for ${path}`), { status: 404 });
  }),
  put: vi.fn(async (_endpoint: string, body: unknown) => ({
    ...fakePatient(),
    ...(body as object),
  })),
  post: vi.fn(async () => ({})),
});

export const stubTranslations = (translations: Record<string, string> = {}) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url !== '/api/public/translation/default') throw new Error(`Unexpected fetch ${url}`);
      return new Response(JSON.stringify(translations), { status: 200 });
    }),
  );

/** Renders a page as the portal does, signed in for `private` pages, at `path`. */
export const renderPortal = ({
  page,
  path,
  routePath = path,
  access = 'private',
  api,
}: {
  page: React.ReactElement;
  path: string;
  routePath?: string;
  access?: 'private' | 'public';
  api: ReturnType<typeof createFakeApi>;
}) => {
  const Route = access === 'private' ? PrivateRoute : PublicRoute;
  const router = createMemoryRouter(
    [
      { path: routePath, element: <Route element={page} /> },
      { path: '/', element: <p>Dashboard</p> },
      { path: '/login', element: <p>Login</p> },
    ],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>
        <TranslationProvider>
          <RouterProvider router={router} />
        </TranslationProvider>
      </ApiContext.Provider>
    </QueryClientProvider>,
  );
  return { router };
};
