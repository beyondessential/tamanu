import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { SurveyView } from '../src/views/SurveyView';
import { createFakeApi, fakePatient, renderPortal, stubTranslations } from './renderPortal';

const textQuestion = (
  code: string,
  text: string,
  screenIndex: number,
  visibilityCriteria = '',
) => ({
  id: `component-${code}`,
  dataElementId: `element-${code}`,
  dataElement: {
    id: `element-${code}`,
    code,
    name: text,
    defaultText: text,
    type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
  },
  text,
  screenIndex,
  componentIndex: 0,
  visibilityStatus: VISIBILITY_STATUSES.CURRENT,
  visibilityCriteria,
  validationCriteria: '',
  config: '',
});

const SURVEY = {
  id: 'survey-drifting',
  name: 'Drifting check-in',
  portalSurveyAssignment: { facilityId: 'facility-drifting' },
  components: [
    textQuestion('SMOKER', 'Do you smoke?', 0),
    textQuestion('PER_DAY', 'How many a day?', 1, JSON.stringify({ SMOKER: 'yes' })),
    textQuestion('NOTES', 'Anything else?', 2),
  ],
};

const renderSurvey = () => {
  stubTranslations();
  const api = createFakeApi({
    me: fakePatient(),
    [`survey/${SURVEY.id}`]: SURVEY,
    'time-zone': { primaryTimeZone: 'Pacific/Auckland' },
    'settings/facility-drifting': {},
  });
  renderPortal({
    page: <SurveyView />,
    path: `/survey/${SURVEY.id}`,
    routePath: '/survey/:surveyId',
    api,
  });
};

describe('SurveyView', () => {
  it('skips a page whose questions are all hidden by an earlier answer', async () => {
    renderSurvey();
    await userEvent.type(await screen.findByRole('textbox', { name: /Do you smoke/ }), 'no');
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));

    expect(await screen.findByText('Page 3 of 3')).toBeTruthy();
    expect(screen.getByText('Anything else?')).toBeTruthy();
    expect(screen.queryByText('How many a day?')).toBeNull();
  });

  it('asks before Back on the first page drops entered answers', async () => {
    renderSurvey();
    await userEvent.type(await screen.findByRole('textbox', { name: /Do you smoke/ }), 'yes');
    await userEvent.click(screen.getByRole('button', { name: /Back/ }));

    expect(await screen.findByText('Discard changes?')).toBeTruthy();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });
});
