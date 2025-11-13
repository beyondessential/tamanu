import React from 'react';
import styled from 'styled-components';
import { TextInput, TranslatedText, Button } from '@tamanu/ui-components';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

export default {
  title: 'Translation/TranslatedText',
  component: TranslatedText,
};

const StringTemplate = args => {
  return (
    <Container>
      <TranslatedText {...args} />
    </Container>
  );
};

export const String = StringTemplate.bind({});
String.args = {
  stringId: 'fruitBowl.banana',
  fallback: 'Banana',
};

export const StringWithReplacements = StringTemplate.bind({});
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

const InputTemplate = () => {
  return (
    <Container>
      <TextInput label={<TranslatedText stringId="fields.textField" fallback="Text Field" />} />
    </Container>
  );
};
export const TranslatedInput = InputTemplate.bind({});

const ButtonTemplate = () => {
  return (
    <Container>
      <Button>
        <TranslatedText stringId="button.label" fallback="Press here" />
      </Button>
    </Container>
  );
};
export const TranslatedButton = ButtonTemplate.bind({});
