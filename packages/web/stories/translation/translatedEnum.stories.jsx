import React from 'react';
import styled from 'styled-components';
import { TranslatedEnum } from '../../app/components/Translation';
import { TranslationProvider } from '../../app/contexts/Translation';
import { MockedApi } from '../utils/mockedApi';
import { SEX_LABELS } from '@tamanu/constants';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

const endpoints = {
  'translation/en': () => {
    return {
      'patient.property.sex.male': 'M (Translated)',
      'patient.property.sex.female': 'F (Translated)',
      'patient.property.sex.other': 'O (Translated)',
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

export const Translated = BasicTemplate.bind({});
Translated.args = {
  value: 'draft',
  enumValues: SEX_LABELS,
};

export const UnTranslated = BasicTemplate.bind({});
UnTranslated.args = {
  value: 'cancelled',
  enumValues: SEX_LABELS,
};

export const Fallback = BasicTemplate.bind({});
Fallback.args = {
  value: 'missing',
  enumValues: SEX_LABELS,
};
