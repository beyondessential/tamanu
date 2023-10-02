import React, { useState } from 'react';
import styled from 'styled-components';
import { DynamicSelectField } from '../app/components';
import { TranslatedText } from '../app/components/Translation/TranslatedText';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

export default {
  argTypes: {
    text: {
      control: 'text',
    },
  },
  title: 'Translation/TranslatedText',
  component: TranslatedText,
};

const Template = ({ name, suggesterEndpoint, ...args }) => {
  return (
    <Container>
      <TranslatedText {...args} />
    </Container>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  stringId: 'fruitBowl.banana',
  fallback: 'banana',
};

// export const MoreThanSevenItems = Template.bind({});
// MoreThanSevenItems.args = {
//   name: 'furniture',
// };

// export const SevenOrLessItemsWithSuggester = Template.bind({});
// SevenOrLessItemsWithSuggester.args = {
//   name: 'lessThanSevenCities',
//   suggesterEndpoint: 'lessThanSevenCities',
// };

// export const MoreThanSevenItemsWithSuggester = Template.bind({});
// MoreThanSevenItemsWithSuggester.args = {
//   name: 'moreThanSevenCities',
//   suggesterEndpoint: 'moreThanSevenCities',
// };
