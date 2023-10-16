import React, { useState } from 'react';
import styled from 'styled-components';
import { LANGUAGE_CODES, LANGUAGE_NAMES } from '@tamanu/constants';
import { LanguageSelector } from '../app/components/LanguageSelector';
import { ApiContext } from '../app/api';

const dummyApi = {
  get: async () => {
    return [
      {
        label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH],
        value: LANGUAGE_CODES.ENGLISH,
      },
      {
        label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER],
        value: LANGUAGE_CODES.KHMER,
      },
    ];
  },
};

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

export default {
  title: 'Translation/LanguageSelector',
  component: LanguageSelector,
};

const Template = args => {
  const [selectedOption, setSelectedOption] = useState(null);

  const onChangeOption = event => {
    setSelectedOption(event.target.value);
  };

  return (
    <ApiContext.Provider value={dummyApi}>
      <Container>
        <LanguageSelector selectedOption={selectedOption} onChange={onChangeOption} {...args} />
      </Container>
    </ApiContext.Provider>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  stringId: 'fruitBowl.banana',
  fallback: 'Banana',
};
