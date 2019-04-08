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

storiesOf('FormControls', module)
  .add('CheckInput', () => <StoryControlWrapper Component={CheckInput} label="Enable" />)
  .add('TextInput', () => <StoryControlWrapper Component={TextInput} label="Display name" />)
  .add('NumberInput', () => <StoryControlWrapper Component={NumberInput} label="Amount" />)
  .add('NumberInput:limited', () => <StoryControlWrapper Component={NumberInput} label="How many fingers am I holding up?" min={0} max={10} />)
  .add('RadioInput', () => <StoryControlWrapper Component={RadioInput} label="Fruit type" options={[
      { value: 'apples', label: 'Apples' }, 
      { value: 'oranges', label: 'Oranges' }, 
      { value: 'bananas', label: 'Bananas' }, 
    ]} />)
  .add('DateInput', () => <StoryControlWrapper Component={DateInput} label="Date of birth" />)
  .add('DateTimeInput', () => <StoryControlWrapper Component={DateTimeInput} label="Sample taken" />)
  .add('SelectInput', () => <StoryControlWrapper Component={SelectInput} label="Country" options={[
      { value: 'TO', label: 'Tonga' }, 
      { value: 'VU', label: 'Vanuatu' }, 
      { value: 'CK', label: 'Cook Islands' }, 
    ]} />)

storiesOf('Advanced form controls', module)
  .add('Autocomplete', () => <StoryControlWrapper Component={CommonAutocomplete} label="Language" />)
  .add('AsyncAutocomplete', () => <StoryControlWrapper Component={TextInput} label="Patient name" />)
  .add('ArrayInput', () => <div>WIP</div>)

storiesOf('Forms', module)
  .add('ExampleForm', () => (
    <Form
      onSubmit={action('submit')}
      initialValues={{
        city: '' 
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
