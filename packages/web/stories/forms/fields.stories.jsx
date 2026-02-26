import React from 'react';
import shortid from 'shortid';
import { action } from 'storybook/actions';
import '@fortawesome/fontawesome-free/css/all.css';
import MuiDialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { TextInput, SelectInput, MultiselectInput } from '@tamanu/ui-components';

import {
  AutocompleteInput,
  DateInput,
  DateTimeInput,
  MonthPicker,
  NullableBooleanInput,
  NumberInput,
  TimeInput,
  TimeWithUnitInput,
  SwitchInput,
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

export default {
  title: 'Form Fields',
};

export const Multiline = () => (
  <StoryControlWrapper Component={TextInput} label="Life story" multiline rows={4} />
);

const TimeWithUnitInputWrapper = props => (
  <StoryControlWrapper
    Component={TimeWithUnitInput}
    label="Time between onset"
    name="onsetMinutes"
    min={0}
    {...props}
  />
);

export const TimeWithUnitInputDefault = () => <TimeWithUnitInputWrapper />;
export const TimeWithUnitInputRequired = () => <TimeWithUnitInputWrapper required />;
export const TimeWithUnitInputDisabled = () => <TimeWithUnitInputWrapper disabled />;
export const TimeWithUnitInputWithHelpText = () => (
  <TimeWithUnitInputWrapper helperText="Here is some help text" />
);
export const TimeWithUnitInputWithError = () => (
  <TimeWithUnitInputWrapper error helperText="Here is an error message" />
);
export const TimeWithUnitInputClearable = () => <TimeWithUnitInputWrapper clearButton />;

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

const DropdownWithTagsWrapper = props => (
  <Container>
    <StoryControlWrapper
      Component={SelectInput}
      label="Simple Select"
      options={TAGGED_FRUITS}
      {...props}
    />
    <StoryControlWrapper
      Component={AutocompleteInput}
      label="Autocomplete"
      options={TAGGED_FRUITS}
      {...props}
    />
    <StoryControlWrapper
      Component={AutocompleteInput}
      label="Async Autocomplete"
      options={TAGGED_FRUITS}
      suggester={dummyTaggedSuggester}
      {...props}
    />
  </Container>
);

export const DropdownWithTagsDefault = () => <DropdownWithTagsWrapper />;
export const DropdownWithTagsRequired = () => <DropdownWithTagsWrapper required />;
export const DropdownWithTagsDisabled = () => <DropdownWithTagsWrapper disabled />;
export const DropdownWithTagsWithHelpText = () => (
  <DropdownWithTagsWrapper helperText="Here is some help text" />
);
export const DropdownWithTagsWithError = () => (
  <DropdownWithTagsWrapper error helperText="Here is an error message" />
);
export const DropdownWithTagsClearable = () => <DropdownWithTagsWrapper clearButton />;

const NullableBooleanInputWrapper = props => (
  <StoryControlWrapper Component={NullableBooleanInput} label="Enable" {...props} />
);

export const NullableBooleanInputDefault = () => <NullableBooleanInputWrapper />;
export const NullableBooleanInputRequired = () => <NullableBooleanInputWrapper required />;
export const NullableBooleanInputDisabled = () => <NullableBooleanInputWrapper disabled />;
export const NullableBooleanInputWithHelpText = () => (
  <NullableBooleanInputWrapper helperText="Here is some help text" />
);
export const NullableBooleanInputWithError = () => (
  <NullableBooleanInputWrapper error helperText="Here is an error message" />
);
export const NullableBooleanInputClearable = () => <NullableBooleanInputWrapper clearButton />;

export const WithPrefilledDate = props => (
  <StoryControlWrapper
    Component={DateInput}
    label="Prefilled"
    value="2019-10-04T08:30:56.200Z"
    {...props}
  />
);

WithPrefilledDate.story = {
  name: 'With prefilled date',
};

export const WithArrows = props => (
  <StoryControlWrapper Component={DateInput} value="2019-10-04T08:30:56.200Z" arrows {...props} />
);

WithArrows.story = {
  name: 'With arrows',
};

export const DateTimeWithPrefilledDate = props => (
  <StoryControlWrapper
    Component={DateTimeInput}
    label="Prefilled"
    value="2019-10-04T08:30:56.200Z"
    {...props}
  />
);

DateTimeWithPrefilledDate.story = {
  name: 'With prefilled date',
};

export const WithPrefilledTime = props => (
  <StoryControlWrapper
    Component={TimeInput}
    label="Prefilled"
    value="2019-10-04T08:30:56.200Z"
    {...props}
  />
);

WithPrefilledTime.story = {
  name: 'With prefilled time',
};

export const WithLimitedRange = () => (
  <StoryControlWrapper
    Component={NumberInput}
    label="How many fingers am I holding up?"
    min={0}
    max={10}
  />
);

WithLimitedRange.story = {
  name: 'With limited range',
};

export const Small = () => (
  <StoryControlWrapper Component={SelectInput} label="Fruit" options={FRUITS} size="small" />
);

const MultiselectInputWrapper = props => (
  <StoryControlWrapper Component={MultiselectInput} label="Fruit" options={FRUITS} {...props} />
);

export const MultiselectInputDefault = () => <MultiselectInputWrapper />;
export const MultiselectInputRequired = () => <MultiselectInputWrapper required />;
export const MultiselectInputDisabled = () => <MultiselectInputWrapper disabled />;
export const MultiselectInputWithHelpText = () => (
  <MultiselectInputWrapper helperText="Here is some help text" />
);
export const MultiselectInputWithError = () => (
  <MultiselectInputWrapper error helperText="Here is an error message" />
);
export const MultiselectInputClearable = () => <MultiselectInputWrapper clearButton />;

const dummySuggester = {
  fetchSuggestions: async search => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    return FRUITS.filter(x => x.label.toLowerCase().includes(search.toLowerCase()));
  },
  fetchCurrentOption: async value => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    return FRUITS.find(x => x.value === value);
  },
};

export const AutocompleteSmall = () => (
  <StoryControlWrapper
    Component={AutocompleteInput}
    value="pomegranates"
    label="Fruit"
    size="small"
    suggester={dummySuggester}
  />
);

AutocompleteSmall.story = {
  name: 'Small',
};

export const AsynchronousOptions = () => (
  <StoryControlWrapper Component={AutocompleteInput} label="Fruit" suggester={dummySuggester} />
);

AsynchronousOptions.story = {
  name: 'Asynchronous options',
};

export const AsyncWithExistingValue = () => (
  <StoryControlWrapper
    Component={AutocompleteInput}
    value="pomegranates"
    label="Fruit"
    suggester={dummySuggester}
  />
);

AsyncWithExistingValue.story = {
  name: 'Async with existing value',
};

export const InsideAModal = props => (
  <MuiDialog width="md" open title="Autocomplete">
    <Box p={5}>
      <AutocompleteInput label="Fruit" options={FRUITS} {...props} />
    </Box>
  </MuiDialog>
);

InsideAModal.story = {
  name: 'Inside a Modal',
};

export const AsyncWithInvalidExistingValue = () => (
  <StoryControlWrapper
    Component={AutocompleteInput}
    value="not a fruit"
    label="Fruit"
    suggester={dummySuggester}
  />
);

AsyncWithInvalidExistingValue.story = {
  name: 'Async with invalid existing value',

  parameters: {
    note: `
  When the server responds informing the control that it's current value
  is invalid, it will dispatch an onChange event setting its value to null.
`,
  },
};

const IdInputWrapper = props => (
  <StoryControlWrapper Component={IdInput} regenerateId={shortid.generate} {...props} />
);

export const IdInputDefault = () => <IdInputWrapper />;
export const IdInputRequired = () => <IdInputWrapper required />;
export const IdInputDisabled = () => <IdInputWrapper disabled />;
export const IdInputWithHelpText = () => (
  <IdInputWrapper helperText="Here is some help text" />
);
export const IdInputWithError = () => (
  <IdInputWrapper error helperText="Here is an error message" />
);
export const IdInputClearable = () => <IdInputWrapper clearButton />;

const CalendarInputWrapper = props => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <StoryControlWrapper Component={MonthPicker} label="Date" {...props} />
  </LocalizationProvider>
);

export const CalendarInputDefault = () => <CalendarInputWrapper />;
export const CalendarInputRequired = () => <CalendarInputWrapper required />;
export const CalendarInputDisabled = () => <CalendarInputWrapper disabled />;
export const CalendarInputWithHelpText = () => (
  <CalendarInputWrapper helperText="Here is some help text" />
);
export const CalendarInputWithError = () => (
  <CalendarInputWrapper error helperText="Here is an error message" />
);
export const CalendarInputClearable = () => <CalendarInputWrapper clearButton />;

const SwitchFieldWrapper = props => (
  <StoryControlWrapper Component={SwitchInput} label="Enable" {...props} />
);

export const SwitchFieldDefault = () => <SwitchFieldWrapper />;
export const SwitchFieldRequired = () => <SwitchFieldWrapper required />;
export const SwitchFieldDisabled = () => <SwitchFieldWrapper disabled />;
export const SwitchFieldWithHelpText = () => (
  <SwitchFieldWrapper helperText="Here is some help text" />
);
export const SwitchFieldWithError = () => (
  <SwitchFieldWrapper error helperText="Here is an error message" />
);
export const SwitchFieldClearable = () => <SwitchFieldWrapper clearButton />;
