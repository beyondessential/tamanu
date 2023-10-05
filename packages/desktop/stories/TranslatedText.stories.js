import React from 'react';
import styled from 'styled-components';
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

const Template = args => {
  return (
    <Container>
      <TranslatedText {...args} />
    </Container>
  );
};

export const String = Template.bind({});
String.args = {
  stringId: 'fruitBowl.banana',
  fallback: 'Banana',
};

export const StringWithReplacements = Template.bind({});
StringWithReplacements.args = {
  stringId: 'fruitBowl.sentence',
  fallback: 'I have a :adjective :fruit that is :color',
  replacements: {
    adjective: (
      <b>
        <TranslatedText stringId="fruitBowl.adjective" fallback="sweet" />
      </b>
    ),
    fruit: (
      <b>
        <TranslatedText stringId="fruitBowl.fruit" fallback="banana" />
      </b>
    ),
    color: (
      <b>
        <TranslatedText stringId="fruitBowl.color" fallback="yellow" />
      </b>
    ),
  },
};
