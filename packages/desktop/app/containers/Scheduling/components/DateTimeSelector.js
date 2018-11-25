import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DatepickerGroup, CheckboxGroup, SelectGroup } from '../../../components';
import { dateFormat, timeFormat, timeSelectOptions } from '../../../constants';

class DateTimeSelector extends Component {
  static propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
  }

  static defaultProps = {
    className: 'columns',
    type: 'admission'
  }

  constructor(props) {
    super(props);
    this.state = { allDay: false };
    this.setAllDay = this.setAllDay.bind(this);
  }

  // componentWillMount() {
  //   this.parseValue(this.props, true);
  // }

  // componentWillReceiveProps(newProps) {
  //   this.parseValue(newProps);
  // }

  // handleChange(value) {
  //   const { name } = this.props;
  //   this.setState({ value });
  //   if (this.props.onChange) this.props.onChange(value, name);
  // }

  setAllDay(event) {
    const allDay = event.target.checked;
    this.setState({ allDay });
  }

  render() {
    const { className, type } = this.props;
    const { allDay } = this.state;

    return (
      <div className={className}>
        {type !== 'admission' &&
          <React.Fragment>
            <DatepickerGroup
              className="column is-3"
              label="Start Date"
              name="startDate"
              required
            />
            {!allDay &&
              <SelectGroup
                className="column is-1"
                label="Start Time"
                name="endDate"
                options={timeSelectOptions.hours}
                required
              />
            }
            {!allDay &&
              <SelectGroup
                className="column is-1 p-t-40"
                label={false}
                name="endDate"
                options={timeSelectOptions.minutes}
              />
            }
            {!allDay &&
              <SelectGroup
                className="column is-1"
                label="End Time"
                name="endDate"
                options={timeSelectOptions.hours}
                required
              />
            }
            {!allDay &&
              <SelectGroup
                className="column is-1 p-t-40"
                label={false}
                name="endDate"
                options={timeSelectOptions.minutes}
              />
            }
            <CheckboxGroup
              label="All Day"
              value="all_day"
              name="all_day"
              onChange={this.setAllDay}
            />
          </React.Fragment>
        }

        {type === 'admission' &&
          <React.Fragment>
            <DatepickerGroup
              className="column is-3"
              label="Start Date"
              name="startDate"
              required
            />
          </React.Fragment>
        }
      </div>
      // <div className="columns">
      //   <DatepickerGroup
      //     className="column is-5"
      //     label="Start Date"
      //     name="startDate"
      //     required
      //   />
      //   <DatepickerGroup
      //     className="column is-5"
      //     label="End Date"
      //     name="endDate"
      //     required
      //   />
      //   <CheckboxGroup
      //     label="All Day"
      //     value="all_day"
      //   />
      // </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, {})(DateTimeSelector);
