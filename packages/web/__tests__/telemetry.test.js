import { describe, expect, it } from 'vitest';
import { resolveNavigationRoute } from '../app/telemetry';

describe('resolveNavigationRoute', () => {
  it.each([
    [
      '/patients/all/p1/encounter/e1/lab-request/l1',
      '/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId',
      { category: 'all', patientId: 'p1', encounterId: 'e1', labRequestId: 'l1' },
    ],
    [
      '/patients/all/p1/encounter/e1/programs/s1/edit',
      '/patients/:category/:patientId/encounter/:encounterId/programs/:surveyResponseId/edit',
      { category: 'all', patientId: 'p1', encounterId: 'e1', surveyResponseId: 's1' },
    ],
    [
      '/patients/all/p1/programs/s1/edit',
      '/patients/:category/:patientId/programs/:surveyResponseId/edit',
      { category: 'all', patientId: 'p1', surveyResponseId: 's1' },
    ],
    ['/program-registry/r1', '/program-registry/:programRegistryId', { programRegistryId: 'r1' }],
    [
      '/admin/programs/forms/manage/pr1',
      '/admin/programs/forms/manage/:programId',
      { programId: 'pr1' },
    ],
    [
      '/admin/programs/registries/r1/conditions',
      '/admin/programs/registries/:programRegistryId/conditions',
      { programRegistryId: 'r1' },
    ],
    [
      '/admin/programs/registries/r1',
      '/admin/programs/registries/:programRegistryId',
      { programRegistryId: 'r1' },
    ],
    [
      '/admin/reports/rep1/versions/v1/edit',
      '/admin/reports/:reportId/versions/:versionId/edit',
      { reportId: 'rep1', versionId: 'v1' },
    ],
    [
      '/admin/users/rolesAndDesignations/roles/delete/role1',
      '/admin/users/rolesAndDesignations/roles/delete/:id',
      { id: 'role1' },
    ],
    [
      '/admin/users/rolesAndDesignations/designations/delete/d1',
      '/admin/users/rolesAndDesignations/designations/delete/:id',
      { id: 'd1' },
    ],
  ])('resolves %s to its route pattern', (pathname, route, pathParams) => {
    expect(resolveNavigationRoute(pathname)).toEqual({ route, pathParams });
  });

  it('collapses an unlisted sub-path to its nearest id-bearing ancestor', () => {
    expect(resolveNavigationRoute('/patients/all/p1/encounter/e1/programs/new')).toEqual({
      route: '/patients/:category/:patientId/encounter/:encounterId',
      pathParams: { category: 'all', patientId: 'p1', encounterId: 'e1' },
    });
  });

  it('records a static path as itself', () => {
    expect(resolveNavigationRoute('/admin/referenceData')).toEqual({
      route: '/admin/referenceData',
      pathParams: {},
    });
  });
});
