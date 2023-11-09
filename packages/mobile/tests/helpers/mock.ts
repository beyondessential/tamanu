import { IPatient, ISurveyScreenComponent, IUser } from '~/types';

export function makeDummyComponent(c: any, index: number): ISurveyScreenComponent {
  return {
    id: `component-${c.code}`,
    required: false,
    dataElement: {
      id: c.code,
      code: c.code,
      name: c.name,
      type: c.type,
      defaultText: '',
      defaultOptions: '',
    },
    screenIndex: 0,
    componentIndex: index,
    text: '',
    visibilityCriteria: '',
    options: '',
    getConfigObject: (): any => c.config || {},
    ...c,
  };
}

export function makeDummySurvey(parts: any[]): ISurveyScreenComponent[] {
  return parts.map((p, i) => makeDummyComponent(p, i));
}

export function mockDummyUser(overrides = {}): IUser {
  return {
    id: '',
    displayId: 'displayId',
    email: 'user@example.com',
    displayName: 'displayName',
    role: 'practitioner',
    localPassword: null,
    ...overrides,
  };
}

export function mockDummyPatient(overrides = {}): IPatient {
  return {
    id: '',
    displayId: '',
    firstName: '',
    sex: 'male',
    ...overrides,
  };
}
