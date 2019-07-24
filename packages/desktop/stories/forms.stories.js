import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import {
  TextInput,
  CheckInput,
  RadioInput,
  DateInput,
  TimeInput,
  DateTimeInput,
  NumberInput,
  SelectInput,

  TextField,
  SelectField,
  Button,
} from '../app/components';
import { CommonAutocomplete } from '../app/components/CommonAutocomplete';

import { Form, Field } from '../app/components/Field/Form';
import Login from '../app/containers/Auth/Login';

const FRUITS = [
  { value: 'apples', label: 'Apples' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'bananas', label: 'Bananas' },
  { value: 'pomegrantes', label: 'Pomegranates' },
  { value: 'durian', label: 'Durian' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'tomatoes', label: 'Tomatoes' },
  { value: 'cherries', label: 'Cherries' },
];

// All Input components are hardcoded to be bound to a containing state
// (ie, if they're just used without value/onChange parameters they will
// behave as read-only). This component creates that containing state
// so we don't have to do it individually for each item.
class StoryControlWrapper extends React.PureComponent {
  state = { value: null };

  onChange = (e) => {
    const { onChange } = this.props;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    action("change")(value);
    this.setState({ value });
  }

  render() {
    const { Component, ...props } = this.props;
    const { value } = this.state;
    return <Component {...props} value={value} onChange={this.onChange} />;
  }
}

// Helper function to add a bunch of standard variants for a given control.
// Returns the chain so additional variants can be added easily when necessary.
function addStories(name, Component, note) {
  return storiesOf(`FormControls/${name}`, module)
    .addParameters({ note })
    .add('Default', () => <Component />)
    .add('Required', () => <Component required />)
    .add('Disabled', () => <Component disabled />)
    .add('With help text', () => <Component helperText="Here is some help text" />)
    .add('With error', () => <Component error helperText="Here is an error message" />);
}

addStories('TextInput', (props) => (
  <StoryControlWrapper
    Component={TextInput}
    label="Display name"
    {...props}
  />
), 'Free text input.')
  .add('Multiline', () => (
    <StoryControlWrapper
      Component={TextInput}
      label="Life story"
      multiline
      rows={4}
    />
  ));

addStories('CheckInput', (props) => (
  <StoryControlWrapper
    Component={CheckInput}
    label="Enable"
    {...props}
  />
));

addStories('DateInput', (props) => (
  <StoryControlWrapper
    Component={DateInput}
    label="Date of birth"
    {...props}
  />
));

addStories('DateTimeInput', (props) => (
  <StoryControlWrapper
    Component={DateTimeInput}
    label="Sample taken"
    {...props}
  />
));

addStories('TimeInput', (props) => (
  <StoryControlWrapper
    Component={TimeInput}
    label="Time"
    {...props}
  />
));

addStories('NumberInput', (props) => (
  <StoryControlWrapper
    Component={NumberInput}
    label="Amount"
    {...props}
  />
))
  .add('With limited range', () => (
    <StoryControlWrapper
      Component={NumberInput}
      label="How many fingers am I holding up?"
      min={0}
      max={10}
    />
  ));

addStories('RadioInput', (props) => (
  <StoryControlWrapper
    Component={RadioInput}
    label="Fruit"
    options={FRUITS.slice(0, 3)}
    {...props}
  />
), "Should only be used for <=5 items. If there're a lot, prefer a SelectInput instead.");

addStories('SelectInput', (props) => (
  <StoryControlWrapper
    Component={SelectInput}
    label="Fruit"
    options={FRUITS}
    {...props}
  />
));

addStories('Autocomplete', (props) => (
  <StoryControlWrapper 
    Component={CommonAutocomplete} 
    label="Fruit"
    options={FRUITS}
    {...props}
  />
)).add('Asynchronous options', () => (
  <StoryControlWrapper 
    Component={CommonAutocomplete} 
    label="Language"
    fetchOptions={async (search) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return FRUITS
        .filter(x => x.label.toLowerCase().includes(search.toLowerCase()));
    }}
  />
));

storiesOf('Advanced form controls', module)
  .add('ArrayInput', () => <div>WIP</div>);

storiesOf('Forms', module)
  .add('ExampleForm', () => (
    <Form
      onSubmit={action('submit')}
      initialValues={{
        city: '',
        country: 'VU',
      }}
      render={() => (
        <div>
          <Field
            name="city"
            label="City"
            component={TextField}
          />
          <Field
            name="country"
            label="Country"
            component={SelectField}
            options={[
              { value: 'TO', label: 'Tonga' },
              { value: 'VU', label: 'Vanuatu' },
              { value: 'CK', label: 'Cook Islands' },
            ]}
          />
          <Button type="submit">Submit</Button>
        </div>
      )}
    />
  ))
  .add('PaginatedForm', () => (
    <div>WIP</div>
  ))
  .add('LoginForm', () => <Login login={action('login')} />);
