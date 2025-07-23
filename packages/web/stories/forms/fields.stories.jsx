import React from 'react';
import shortid from 'shortid';
import { action } from 'storybook/actions';
import '@fortawesome/fontawesome-free/css/all.css';
import MuiDialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import {
  AutocompleteInput,
  DateInput,
  DateTimeInput,
  MonthPicker,
  MultiselectInput,
  NullableBooleanInput,
  NumberInput,
  SelectInput,
  TextInput,
  TimeInput,
  TimeWithUnitInput,
  SwitchInput,
} from '../../app/components';
import { IdInput } from '../../app/components/Field/IdField';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default {
  title: 'Form Fields',
  parameters: {
    layout: 'centered',
  },
};

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

// Helper function to create field stories using modern CSF args pattern
export function createFieldStories(Component, extraArgs = {}) {
  return {
    Default: { args: {} },
    Required: { args: { required: true } },
    Disabled: { args: { disabled: true } },
    WithHelpText: { args: { helperText: 'Here is some help text' } },
    WithError: { args: { error: true, helperText: 'Here is an error message' } },
    Clearable: { args: { clearButton: true } },
    ...extraArgs,
  };
}

export const Multiline = () => (
  <StoryControlWrapper Component={TextInput} label="Life story" multiline rows={4} />
);

// TimeWithUnitInput stories
const TimeWithUnitInputTemplate = args => (
  <StoryControlWrapper
    Component={TimeWithUnitInput}
    label="Time between onset"
    name="onsetMinutes"
    min={0}
    {...args}
  />
);

const timeWithUnitInputStories = createFieldStories();
export const TimeWithUnitInputDefault = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.Default,
};
export const TimeWithUnitInputRequired = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.Required,
};
export const TimeWithUnitInputDisabled = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.Disabled,
};
export const TimeWithUnitInputWithHelpText = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.WithHelpText,
};
export const TimeWithUnitInputWithError = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.WithError,
};
export const TimeWithUnitInputClearable = {
  render: TimeWithUnitInputTemplate,
  ...timeWithUnitInputStories.Clearable,
};

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

// Dropdown with tags stories
const DropdownWithTagsTemplate = args => {
  return (
    <Container>
      <StoryControlWrapper
        Component={SelectInput}
        label="Simple Select"
        options={TAGGED_FRUITS}
        {...args}
      />
      <StoryControlWrapper
        Component={AutocompleteInput}
        label="Autocomplete"
        options={TAGGED_FRUITS}
        {...args}
      />
      <StoryControlWrapper
        Component={AutocompleteInput}
        label="Async Autocomplete"
        options={TAGGED_FRUITS}
        suggester={dummyTaggedSuggester}
        {...args}
      />
    </Container>
  );
};

const dropdownWithTagsStories = createFieldStories();
export const DropdownWithTagsDefault = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.Default,
};
export const DropdownWithTagsRequired = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.Required,
};
export const DropdownWithTagsDisabled = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.Disabled,
};
export const DropdownWithTagsWithHelpText = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.WithHelpText,
};
export const DropdownWithTagsWithError = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.WithError,
};
export const DropdownWithTagsClearable = {
  render: DropdownWithTagsTemplate,
  ...dropdownWithTagsStories.Clearable,
};

// NullableBooleanInput stories
const NullableBooleanInputTemplate = args => (
  <StoryControlWrapper Component={NullableBooleanInput} label="Enable" {...args} />
);

const nullableBooleanInputStories = createFieldStories();
export const NullableBooleanInputDefault = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.Default,
};
export const NullableBooleanInputRequired = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.Required,
};
export const NullableBooleanInputDisabled = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.Disabled,
};
export const NullableBooleanInputWithHelpText = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.WithHelpText,
};
export const NullableBooleanInputWithError = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.WithError,
};
export const NullableBooleanInputClearable = {
  render: NullableBooleanInputTemplate,
  ...nullableBooleanInputStories.Clearable,
};

export const WithPrefilledDate = {
  render: args => (
    <StoryControlWrapper
      Component={DateInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
      {...args}
    />
  ),
  name: 'With prefilled date',
};

export const WithArrows = {
  render: args => (
    <StoryControlWrapper Component={DateInput} value="2019-10-04T08:30:56.200Z" arrows {...args} />
  ),
  name: 'With arrows',
};

export const _WithPrefilledDate = {
  render: args => (
    <StoryControlWrapper
      Component={DateTimeInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
      {...args}
    />
  ),
  name: 'With prefilled date',
};

export const WithPrefilledTime = {
  render: args => (
    <StoryControlWrapper
      Component={TimeInput}
      label="Prefilled"
      value="2019-10-04T08:30:56.200Z"
      {...args}
    />
  ),
  name: 'With prefilled time',
};

export const WithLimitedRange = {
  render: () => (
    <StoryControlWrapper
      Component={NumberInput}
      label="How many fingers am I holding up?"
      min={0}
      max={10}
    />
  ),
  name: 'With limited range',
};

export const Small = {
  render: () => (
    <StoryControlWrapper Component={SelectInput} label="Fruit" options={FRUITS} size="small" />
  ),
};

// MultiselectInput stories
const MultiselectInputTemplate = args => (
  <StoryControlWrapper Component={MultiselectInput} label="Fruit" options={FRUITS} {...args} />
);

const multiselectInputStories = createFieldStories();
export const MultiselectInputDefault = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.Default,
};
export const MultiselectInputRequired = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.Required,
};
export const MultiselectInputDisabled = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.Disabled,
};
export const MultiselectInputWithHelpText = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.WithHelpText,
};
export const MultiselectInputWithError = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.WithError,
};
export const MultiselectInputClearable = {
  render: MultiselectInputTemplate,
  ...multiselectInputStories.Clearable,
};

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

export const _Small = () => (
  <StoryControlWrapper
    Component={AutocompleteInput}
    value="pomegranates"
    label="Fruit"
    size="small"
    suggester={dummySuggester}
  />
);

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

// IdInput stories
const IdInputTemplate = args => (
  <StoryControlWrapper Component={IdInput} regenerateId={shortid.generate} {...args} />
);

const idInputStories = createFieldStories();
export const IdInputDefault = { render: IdInputTemplate, ...idInputStories.Default };
export const IdInputRequired = { render: IdInputTemplate, ...idInputStories.Required };
export const IdInputDisabled = { render: IdInputTemplate, ...idInputStories.Disabled };
export const IdInputWithHelpText = { render: IdInputTemplate, ...idInputStories.WithHelpText };
export const IdInputWithError = { render: IdInputTemplate, ...idInputStories.WithError };
export const IdInputClearable = { render: IdInputTemplate, ...idInputStories.Clearable };

// CalendarInput stories
const CalendarInputTemplate = args => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <StoryControlWrapper Component={MonthPicker} label="Date" {...args} />
  </LocalizationProvider>
);

const calendarInputStories = createFieldStories();
export const CalendarInputDefault = {
  render: CalendarInputTemplate,
  ...calendarInputStories.Default,
};
export const CalendarInputRequired = {
  render: CalendarInputTemplate,
  ...calendarInputStories.Required,
};
export const CalendarInputDisabled = {
  render: CalendarInputTemplate,
  ...calendarInputStories.Disabled,
};
export const CalendarInputWithHelpText = {
  render: CalendarInputTemplate,
  ...calendarInputStories.WithHelpText,
};
export const CalendarInputWithError = {
  render: CalendarInputTemplate,
  ...calendarInputStories.WithError,
};
export const CalendarInputClearable = {
  render: CalendarInputTemplate,
  ...calendarInputStories.Clearable,
};

// SwitchField stories
const SwitchFieldTemplate = args => (
  <StoryControlWrapper Component={SwitchInput} label="Enable" {...args} />
);

const switchFieldStories = createFieldStories();
export const SwitchFieldDefault = { render: SwitchFieldTemplate, ...switchFieldStories.Default };
export const SwitchFieldRequired = { render: SwitchFieldTemplate, ...switchFieldStories.Required };
export const SwitchFieldDisabled = { render: SwitchFieldTemplate, ...switchFieldStories.Disabled };
export const SwitchFieldWithHelpText = {
  render: SwitchFieldTemplate,
  ...switchFieldStories.WithHelpText,
};
export const SwitchFieldWithError = {
  render: SwitchFieldTemplate,
  ...switchFieldStories.WithError,
};
export const SwitchFieldClearable = {
  render: SwitchFieldTemplate,
  ...switchFieldStories.Clearable,
};
