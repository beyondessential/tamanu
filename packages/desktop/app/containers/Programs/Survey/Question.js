import React from 'react';
import {
  TextInput, RadioInput, CheckInput, DateInput,
} from '../../../components';

export function Question({ type, ...props }) {
  switch (type) {
    default:
      return null;
    case 'Number':
      return <TextInput {...mapBaseProps(props)} type="number" />;
    case 'Radio':
      return <RadioInput {...mapRadioProps(props)} />;
    case 'Binary':
      return <RadioInput {...mapBinaryProps(props)} />;
    case 'FreeText':
      return <TextInput {...mapBaseProps(props)} multiline rows="3" />;
    case 'Checkbox':
      return <CheckInput {...mapBaseProps(props)} />;
    case 'Date':
      return <DateInput {...mapBaseProps(props)} />;
  }
}

const mapBinaryProps = (props) => mapRadioProps({ ...props, options: ['Yes', 'No'] });

const mapRadioProps = ({ options, ...props }) => {
  const optionsMapped = options.map(option => ({ value: option.toLowerCase(), label: option }));
  return { ...mapBaseProps(props), options: optionsMapped };
};

const mapBaseProps = ({
  _id, text, answer, onChange, readOnly,
}) => ({
  name: _id,
  value: answer,
  label: text,
  onChange,
  disabled: readOnly,
});
