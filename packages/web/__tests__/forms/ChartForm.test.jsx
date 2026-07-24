import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';

import { ChartForm } from '../../app/forms/ChartForm';

// Regression test for the validation schema construction in
// packages/web/app/forms/ChartForm.jsx.
//
// The validation schema was previously built from every survey component while
// the screen only renders components with a visibilityStatus of current. A
// mandatory question retired to historical status stayed .required() but was
// never rendered, so the form could not be submitted and the error was
// attached to a field that does not exist on screen. The schema must be built
// from the visible components only, as VitalsForm does.

const captured = vi.hoisted(() => ({ validationSchema: null }));

const { mockUseSurveyQuery, mockUsePatientAdditionalDataQuery } = vi.hoisted(() => ({
  mockUseSurveyQuery: vi.fn(),
  mockUsePatientAdditionalDataQuery: vi.fn(),
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
    // Capture the validation schema instead of mounting the whole form body.
    Form: props => {
      captured.validationSchema = props.validationSchema;
      return <div data-testid="chart-form-body" />;
    },
  };
});

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, ability: { can: () => true } }),
}));

vi.mock('../../app/contexts/Encounter.jsx', () => ({
  useEncounter: () => ({ encounter: { encounterType: 'admission' } }),
}));

vi.mock('../../app/contexts/Translation', () => ({
  useTranslation: () => ({ getTranslation: (stringId, fallback) => fallback }),
}));

vi.mock('../../app/api/queries/useSurveyQuery', () => ({
  useSurveyQuery: (...args) => mockUseSurveyQuery(...args),
}));

vi.mock('../../app/api/queries', () => ({
  usePatientAdditionalDataQuery: (...args) => mockUsePatientAdditionalDataQuery(...args),
}));

vi.mock('../../app/api', () => ({
  combineQueries: queries => ({
    data: queries.map(query => query.data),
    isLoading: queries.some(query => query.isLoading),
    isError: queries.some(query => query.isError),
    error: null,
  }),
}));

vi.mock('../../app/components/Surveys/getComponentForQuestionType.jsx', () => ({
  getComponentForQuestionType: () => () => null,
}));

const makeComponent = ({ id, visibilityStatus }) => ({
  id: `component-${id}`,
  dataElementId: id,
  dataElement: { id, type: PROGRAM_DATA_ELEMENT_TYPES.TEXT, defaultText: `Question ${id}` },
  validationCriteria: JSON.stringify({ mandatory: true }),
  config: '',
  text: `Question ${id}`,
  visibilityStatus,
  screenIndex: 0,
  componentIndex: 0,
});

const chartSurveyData = {
  id: 'chart-survey-1',
  components: [
    makeComponent({ id: 'pde-visible', visibilityStatus: VISIBILITY_STATUSES.CURRENT }),
    makeComponent({ id: 'pde-historical', visibilityStatus: VISIBILITY_STATUSES.HISTORICAL }),
  ],
};

const renderChartForm = () =>
  render(
    <ChartForm
      patient={{ id: 'patient-1' }}
      onSubmit={() => {}}
      onClose={() => {}}
      chartSurveyId="chart-survey-1"
    />,
  );

describe('ChartForm validation schema', () => {
  beforeEach(() => {
    captured.validationSchema = null;
    mockUseSurveyQuery.mockReturnValue({
      data: chartSurveyData,
      isLoading: false,
      isError: false,
    });
    mockUsePatientAdditionalDataQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
    });
  });

  it('does not require answers for mandatory questions retired to historical status', () => {
    renderChartForm();

    expect(captured.validationSchema.isValidSync({ 'pde-visible': 'answered' })).toBe(true);
  });

  it('still requires answers for visible mandatory questions', () => {
    renderChartForm();

    expect(captured.validationSchema.isValidSync({})).toBe(false);
  });
});
