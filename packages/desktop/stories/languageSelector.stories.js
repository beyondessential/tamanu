import React from 'react';
import styled from 'styled-components';
import { LANGUAGE_CODES, LANGUAGE_NAMES } from '@tamanu/constants';
import { LanguageSelector } from '../app/components/LanguageSelector';
import { ApiContext } from '../app/api';

const exampleOptions = [
  {
    label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH],
    value: LANGUAGE_CODES.ENGLISH,
  },
  {
    label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER],
    value: LANGUAGE_CODES.KHMER,
  },
];

const multipleLanguageApi = {
  get: async () => {
    return exampleOptions;
  },
};

const singleLanguageApi = {
  get: async () => {
    return exampleOptions.slice(1);
  },
};

const noLanguageApi = {
  get: async () => {
    return [];
  },
};

const Container = styled.div`
  padding: 1rem;
  height: 80px;
  max-width: 500px;
  position: relative;
`;

export default {
  title: 'Translation/LanguageSelector',
  component: LanguageSelector,
};

const Template = args => {
  const { api } = args;
  return (
    <ApiContext.Provider value={api}>
      <Container>
        <LanguageSelector setFieldValue={() => null} {...args} />
      </Container>
    </ApiContext.Provider>
  );
};

export const MultipleLanguages = Template.bind({});
MultipleLanguages.args = {
  api: multipleLanguageApi,
};

export const SingleLanguage = Template.bind({});
SingleLanguage.args = {
  api: singleLanguageApi,
};

export const NoLanguage = Template.bind({});
NoLanguage.args = {
  api: noLanguageApi,
};
