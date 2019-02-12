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
    name: PropTypes.string.isRequired,
    required: PropTypes.bool,
    className: PropTypes.string,
    inputClass: PropTypes.string,
    labelClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    value: PropTypes.any,
    readOnly: PropTypes.bool,
    todayAsDefault: PropTypes.bool,
    timeFormat: PropTypes.string,
    timeIntervals: PropTypes.number,
    timeCaption: PropTypes.string
  }

  static defaultProps = {
    required: false,
    className: '',
    inputClass: 'input custom-date-input',
    labelClass: 'input-group-title',
    overwriteClass: false,
    showTimeSelect: false,
    value: moment(),
    readOnly: false,
    todayAsDefault: true,
    timeFormat: '',
    timeIntervals: 15,
    timeCaption: 'Time'
  }

  componentWillMount() {
    this.parseValue(this.props, true);
  }

  componentWillReceiveProps(newProps) {
    this.parseValue(newProps);
  }

  parseValue(props, init = false) {
    const { value, todayAsDefault } = props;
    // value = moment(value);
    // if (init) value = todayAsDefault ? moment() : null;
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
      readOnly,
      showTimeSelect,
      todayAsDefault,
      onChange,
      value: _,
      ...others
    } = this.props;
    let { value } = this.state;
    if (typeof value === 'string') value = moment(value);
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
            {...others}
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
