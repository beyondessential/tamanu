import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import CustomDateInput from './CustomDateInput';
import { dateFormat, timeFormat } from '../constants';

const Column = styled.div`
  margin-top: 8px;
  padding: 0rem;
`;
const GroupTitle = styled.span`
  color: ${props => props.theme.palette.primary.textMedium};
  display: inline-block;
  margin-bottom: 5px;
  font-weight: bold;
`;

class DatepickerGroup extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    inputClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
    disabled: PropTypes.bool,
    todayAsDefault: PropTypes.bool,
    timeFormat: PropTypes.string,
    timeIntervals: PropTypes.number,
    timeCaption: PropTypes.string,
  };

  static defaultProps = {
    className: '',
    inputClass: '',
    overwriteClass: false,
    disabled: false,
    required: false,
    showTimeSelect: false,
    timeCaption: 'Time',
    timeFormat: '',
    timeIntervals: 15,
    todayAsDefault: true,
    value: moment(),
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  UNSAFE_componentWillMount() {
    this.parseValue(this.props, true);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    this.parseValue(newProps);
  }

  parseValue(props) {
    const { value } = props;
    this.setState({ value });
  }

  handleChange(value) {
    const { name } = this.props;
    this.setState({ value });
    if (this.props.onChange) this.props.onChange(value, name);
  }

  render() {
    const {
      label,
      required,
      name,
      tabIndex,
      overwriteClass,
      inputClass,
      labelClass,
      disabled,
      showTimeSelect,
      todayAsDefault,
      onChange,
      value: _,
      theme,
      ...others
    } = this.props;
    let { value } = this.state;
    if (typeof value === 'string') value = moment(value);
    let { className } = this.props;
    if (!overwriteClass) className = `column ${className}`;

    return (
      <Column className={className}>
        {label !== false && (
          <GroupTitle theme={theme}>
            {label}
            {required && <span className="isRequired">*</span>}
          </GroupTitle>
        )}
        {disabled && <CustomDateInput disabled value={value} />}
        {!disabled && (
          <DatePicker
            name={name}
            tabIndex={tabIndex}
            customInput={<CustomDateInput />}
            selected={value}
            onChange={this.handleChange}
            showTimeSelect={showTimeSelect}
            timeFormat={timeFormat}
            timeIntervals={10}
            dateFormat={dateFormat}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            {...others}
          />
        )}
      </Column>
    );
  }
}

export default withTheme(DatepickerGroup);
