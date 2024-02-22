import React from 'react';
import styled from 'styled-components';
import { TranslatedEnum } from '../../app/components/Translation';
import { TranslationProvider } from '../../app/contexts/Translation';
import { MockedApi } from '../utils/mockedApi';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

const endpoints = {
  'translation/en': () => {
    return {
      'status.draft': 'Draft (Translated)',
      'status.sent': 'Sent (Translated)',
      'status.paid': 'Paid (Translated)',
    };
  },
};

export default {
  title: 'Translation/TranslatedEnum',
  component: TranslatedEnum,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <TranslationProvider>
          <Container>
            <Story />
          </Container>
        </TranslationProvider>
      </MockedApi>
    ),
  ],
};

const BasicTemplate = args => <TranslatedEnum {...args} />;

const STATUS_LABELS = {
  draft: 'Draft (default)',
  sent: 'Sent (default)',
  paid: 'Paid (default)',
  cancelled: 'Cancelled (default)',
};

export const Translated = BasicTemplate.bind({});
Translated.args = {
  prefix: 'status',
  value: 'draft',
  enumValues: STATUS_LABELS,
};

export const UnTranslated = BasicTemplate.bind({});
UnTranslated.args = {
  prefix: 'status',
  value: 'cancelled',
  enumValues: STATUS_LABELS,
};

export const Fallback = BasicTemplate.bind({});
Fallback.args = {
  prefix: 'status',
  value: 'missing',
  enumValues: STATUS_LABELS,
};
