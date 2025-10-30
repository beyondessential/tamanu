import React from 'react';
import styled from 'styled-components';
import { TextInput, Button, TranslatedText } from '@tamanu/ui-components';
import { TranslationProvider } from '../../app/contexts/Translation';
import { MockedApi } from '../utils/mockedApi';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

const endpoints = {
  'translation/en': () => {
    return {
      'fruitBowl.banana': 'Banana123',
    };
  },
};

export default {
  title: 'Translation/TranslatedText',
  component: TranslatedText,
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

const StringTemplate = args => <TranslatedText {...args} />;

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
  return <TextInput label={<TranslatedText stringId="fields.textField" fallback="Text Field" />} />;
};
export const TranslatedInput = InputTemplate.bind({});

const ButtonTemplate = () => {
  return (
    <Button>
      <TranslatedText stringId="button.label" fallback="Press here" />
    </Button>
  );
};
export const TranslatedButton = ButtonTemplate.bind({});
