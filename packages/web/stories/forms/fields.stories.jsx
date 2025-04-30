import React from 'react';
import { action } from '@storybook/addon-actions';
import '@fortawesome/fontawesome-free/css/all.css';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import {
  AutocompleteInput,
  DateInput,
  DateTimeInput,
  MultiselectInput,
  NullableBooleanInput,
  NumberInput,
  SelectInput,
  TextInput,
  TimeInput,
  TimeWithUnitInput,
} from '../../app/components';
import { IdInput } from '../../app/components/Field/IdField';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const FRUITS = [
  { value: 'apples', label: 'Apples' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'bananas', label: 'Bananas' },
  { value: 'pomegranates', label: 'Pomegranates' },
  { value: 'durian', label: 'Durian' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'tomatoes', label: 'Tomatoes' },
  { value: 'cherries', label: 'Cherries' },
  { value: 'fruit salad, 500g', label: 'Fruit salad, 500g' },
  { value: 'fruit salad, 250g', label: 'Fruit salad, 250g' },
];

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

// All Input components are hardcoded to be bound to a containing state
// (ie, if they're just used without value/onChange parameters they will
// behave as read-only). This component creates that containing state
// so we don't have to do it individually for each item.
class StoryControlWrapper extends React.PureComponent {
  state = { value: null };

  componentDidMount() {
    const { value } = this.props;
    if (value) {
      this.setState({ value });
    }
  }

  onChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    action('change')(value);
    this.setState({ value });
  };

  render() {
    const { Component, clearButton, ...props } = this.props;
    const { value } = this.state;
    return (
      <Container>
        <Component {...props} value={value} onChange={this.onChange} />
        {clearButton && (
          <Button onClick={() => this.setState({ value: '' })}>
            {' '}
            Clear Field (value = &ldquo;&rdquo;){' '}
          </Button>
        )}
      </Container>
    );
  }
}

const TAGS = {
  primary: {
    label: 'Available',
    color: '#326699',
    background: '#EBF0F5',
  },
  secondary: {
    label: 'Occupied',
    color: '#F17F16;',
    background: '#F4EEE8',
  },
  tertiary: {
    label: 'Reserved',
    color: '#F76853',
    background: '#FFF0EE',
  },
};

const TAGGED_FRUITS = [
  { value: 'apples', label: 'Apples', tag: TAGS.primary },
  { value: 'oranges', label: 'Oranges', tag: TAGS.secondary },
  { value: 'bananas', label: 'Bananas', tag: TAGS.primary },
  { value: 'pomegranates', label: 'Pomegranates', tag: TAGS.tertiary },
  { value: 'durian', label: 'Durian', tag: TAGS.primary },
  { value: 'dragonfruit', label: 'Dragonfruit', tag: TAGS.secondary },
  { value: 'tomatoes', label: 'Tomatoes', tag: TAGS.primary },
  { value: 'cherries', label: 'Cherries', tag: TAGS.tertiary },
];

const dummyTaggedSuggester = {
  fetchSuggestions: async search => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    return TAGGED_FRUITS.filter(x => x.label.toLowerCase().includes(search.toLowerCase()));
  },
  fetchCurrentOption: async value => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    return TAGGED_FRUITS.find(x => x.value === value);
  },
};

// TextInput Stories
export default {
  title: 'Forms/TextInput',
  component: TextInput,
  parameters: {
    note: 'Free text input.',
  },
};

export const Default = {
  render: () => <StoryControlWrapper Component={TextInput} label="Label Name" />,
};

export const Required = {
  render: () => <StoryControlWrapper Component={TextInput} label="Label Name" required />,
};

export const Disabled = {
  render: () => <StoryControlWrapper Component={TextInput} label="Label Name" disabled />,
};

export const WithHelpText = {
  render: () => (
    <StoryControlWrapper Component={TextInput} label="Label Name" helperText="Here is some help text" />
  ),
};

export const WithError = {
  render: () => (
    <StoryControlWrapper
      Component={TextInput}
      label="Label Name"
      error
      helperText="Here is an error message"
    />
  ),
};

export const Clearable = {
  render: () => <StoryControlWrapper Component={TextInput} label="Label Name" clearButton />,
};

export const Multiline = {
  render: () => (
    <StoryControlWrapper Component={TextInput} label="Life story" multiline rows={4} />
  ),
};

// TimeWithUnitInput Stories
export const TimeWithUnitDefault = {
  render: () => (
    <StoryControlWrapper
      Component={TimeWithUnitInput}
      label="Time between onset"
      name="onsetMinutes"
      min={0}
    />
  ),
};

// Dropdown with tags Stories
export const DropdownWithTags = {
  render: () => (
    <Container>
      <StoryControlWrapper
        Component={SelectInput}
        label="Simple Select"
        options={TAGGED_FRUITS}
      />
      <StoryControlWrapper
        Component={AutocompleteInput}
        label="Autocomplete"
        options={TAGGED_FRUITS}
      />
      <StoryControlWrapper
        Component={AutocompleteInput}
        label="Async Autocomplete"
        options={TAGGED_FRUITS}
        suggester={dummyTaggedSuggester}
      />
    </Container>
  ),
};

// NullableBooleanInput Stories
export const NullableBooleanDefault = {
  render: () => <StoryControlWrapper Component={NullableBooleanInput} label="Enable" />,
};

// DateInput Stories
export const DateInputDefault = {
  render: () => <StoryControlWrapper Component={DateInput} label="Date of birth" />,
};

export const DateInputWithPrefilled = {
  render: () => (
    <StoryControlWrapper
      Component={DateInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
    />
  ),
};

export const DateInputWithArrows = {
  render: () => (
    <StoryControlWrapper Component={DateInput} value="2019-10-04T08:30:56.200Z" arrows />
  ),
};

// DateTimeInput Stories
export const DateTimeInputDefault = {
  render: () => <StoryControlWrapper Component={DateTimeInput} label="Sample taken" />,
};

export const DateTimeInputWithPrefilled = {
  render: () => (
    <StoryControlWrapper
      Component={DateTimeInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
    />
  ),
};

// TimeInput Stories
export const TimeInputDefault = {
  render: () => <StoryControlWrapper Component={TimeInput} label="Time" />,
};

export const TimeInputWithPrefilled = {
  render: () => (
    <StoryControlWrapper
      Component={TimeInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
    />
  ),
};

// NumberInput Stories
export const NumberInputDefault = {
  render: () => <StoryControlWrapper Component={NumberInput} label="Amount" />,
};

export const NumberInputWithRange = {
  render: () => (
    <StoryControlWrapper
      Component={NumberInput}
      label="How many fingers am I holding up?"
      min={0}
      max={10}
    />
  ),
};

// SelectInput Stories
export const SelectInputDefault = {
  render: () => (
    <StoryControlWrapper Component={SelectInput} label="Fruit" options={FRUITS} />
  ),
};

export const SelectInputSmall = {
  render: () => (
    <StoryControlWrapper Component={SelectInput} label="Fruit" options={FRUITS} size="small" />
  ),
};

// MultiselectInput Stories
export const MultiselectInputDefault = {
  render: () => (
    <StoryControlWrapper Component={MultiselectInput} label="Fruit" options={FRUITS} />
  ),
};
