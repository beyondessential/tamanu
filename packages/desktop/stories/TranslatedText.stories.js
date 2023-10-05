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

export const Basic = Template.bind({});
Basic.args = {
  stringId: 'fruitBowl.banana',
  fallback: 'Banana',
};
