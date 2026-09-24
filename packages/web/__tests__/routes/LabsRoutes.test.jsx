import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../app/views/LabRequestListingView', () => ({
  LabRequestListingView: () => <div>active listing</div>,
  FinalisedLabRequestListingView: () => <div>finalised listing</div>,
}));

const { LabsRoutes } = await import('../../app/routes/LabsRoutes');

// A relative redirect target appends rather than replaces, so a broken one never settles.
// Fail loudly instead of hanging the suite.
const RedirectGuard = ({ visited }) => {
  const { pathname } = useLocation();
  if (visited[visited.length - 1] !== pathname) visited.push(pathname);
  if (visited.length > 5) throw new Error(`Redirect loop: ${visited.join(' -> ')}`);
  return null;
};

const renderAt = (path) => {
  const visited = [];
  render(
    <MemoryRouter initialEntries={[path]}>
      <RedirectGuard visited={visited} />
      <Routes>
        <Route path="/lab-requests/*" element={<LabsRoutes />} />
      </Routes>
    </MemoryRouter>,
  );
  return visited[visited.length - 1];
};

describe('LabsRoutes', () => {
  it('renders the finalised listing', () => {
    expect(renderAt('/lab-requests/finalised')).toBe('/lab-requests/finalised');
    expect(screen.getByText('finalised listing')).toBeTruthy();
  });

  it('redirects the old published path to finalised', () => {
    expect(renderAt('/lab-requests/published')).toBe('/lab-requests/finalised');
    expect(screen.getByText('finalised listing')).toBeTruthy();
  });

  it('falls back to the active listing', () => {
    expect(renderAt('/lab-requests')).toBe('/lab-requests/all');
    expect(renderAt('/lab-requests/not-a-page')).toBe('/lab-requests/all');
  });
});
