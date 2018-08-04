import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import CustomDateInput from './CustomDateInput';
import { dateFormat, timeFormat } from '../constants';

class DatepickerGroup extends Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    inputClass: PropTypes.string,
    labelClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    todayAsDefault: PropTypes.bool,
  }

  static defaultProps = {
    required: false,
    className: '',
    inputClass: 'input custom-date-input',
    labelClass: 'input-group-title',
    overwriteClass: false,
    showTimeSelect: false,
    value: moment().format(dateFormat),
    readOnly: false,
    todayAsDefault: true,
  }

  componentWillMount() {
    this.parseValue(this.props, true);
  }

  componentWillReceiveProps(newProps) {
    this.parseValue(newProps);
  }

  parseValue(props, init = false) {
    let { value, todayAsDefault } = props;
    value = moment(value);
    if (!todayAsDefault && init) value = null;
    this.setState({ value });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange(event);
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
      readOnly,
      showTimeSelect,
      todayAsDefault
    } = this.props;
    const { value } = this.state;
    let { className } = this.props;
    if (!overwriteClass) className = `column ${className}`;

    return (
      <div className={className}>
        {label !== false &&
          <span className={labelClass}>
            {label} {required && <span className="isRequired">*</span>}
          </span>
        }
        {readOnly && <CustomDateInput styleName={inputClass} value={value} />}
        {!readOnly &&
          <DatePicker
            name={name}
            tabIndex={tabIndex}
            customInput={<CustomDateInput styleName={inputClass} />}
            selected={value}
            onChange={this.handleChange.bind(this)}
            showTimeSelect={showTimeSelect}
            timeFormat={timeFormat}
            timeIntervals={10}
            dateFormat={dateFormat}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, {})(DatepickerGroup);
