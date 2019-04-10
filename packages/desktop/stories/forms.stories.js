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

class StoryControlWrapper extends React.PureComponent {
  state = { value: null };
  onChange = (e) => { 
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    this.setState({ value });
  }
  render() {
    const { Component, ...props } = this.props;
    const { value } = this.state;
    return <Component {...props} value={value} onChange={this.onChange} />;
  }
}

function addStories(name, Component) {
  return storiesOf('FormControls/' + name, module)
    .add('Default', () => <Component />)
    .add('Required', () => <Component required />)
    .add('Disabled', () => <Component disabled />)
    .add('With help text', () => <Component helperText="Here is some help text" />)
    .add('With error', () => <Component error helperText="Here is an error message" />);
}

addStories('TextInput', (props) => <StoryControlWrapper 
  Component={TextInput}
  label="Display name"
  {...props}
/>);

addStories('CheckInput', (props) => <StoryControlWrapper 
  Component={CheckInput}
  label="Enable"
  {...props}
/>);

addStories('DateInput', (props) => <StoryControlWrapper 
  Component={DateInput}
  label="Date of birth"
  {...props}
/>);

addStories('DateTimeInput', (props) => <StoryControlWrapper 
  Component={DateTimeInput}
  label="Sample taken"
  {...props}
/>);

addStories('NumberInput', (props) => <StoryControlWrapper 
  Component={NumberInput}
  label="Amount"
  {...props}
/>)
  .add('With limited range', () => <StoryControlWrapper 
    Component={NumberInput}
    label="How many fingers am I holding up?" 
    min={0}
    max={10} 
  />)

addStories('RadioInput', (props) => <StoryControlWrapper 
  Component={RadioInput}
  label="Fruit"
  options={[
    { value: 'apples', label: 'Apples' }, 
    { value: 'oranges', label: 'Oranges' }, 
    { value: 'bananas', label: 'Bananas' }, 
  ]}
  {...props}
/>);

addStories('SelectInput', (props) => <StoryControlWrapper 
  Component={SelectInput}
  label="Fruit"
  options={[
    { value: 'apples', label: 'Apples' }, 
    { value: 'oranges', label: 'Oranges' }, 
    { value: 'bananas', label: 'Bananas' }, 
  ]}
  {...props}
/>);

storiesOf('Advanced form controls', module)
  .add('Autocomplete', () => <StoryControlWrapper Component={CommonAutocomplete} label="Language" />)
  .add('AsyncAutocomplete', () => <StoryControlWrapper Component={TextInput} label="Patient name" />)
  .add('ArrayInput', () => <div>WIP</div>)

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
