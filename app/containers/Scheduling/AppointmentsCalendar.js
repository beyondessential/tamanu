import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import Serializer from '../../utils/form-serialize';
import { createMedication } from '../../actions/medications';
import { visitOptions, appointments } from '../../constants';

import { ClearButton, FilterButton } from '../../components/Button';

BigCalendar.momentLocalizer(moment);

class AppointmentsCalendar extends Component {
  state = {
    selectValue: '',
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Appointments Calendar
          </span>
          <div className="view-action-buttons">
            <button>
              + New Appointment
            </button>
          </div>
        </div>
        <form
          className="create-container"
          onSubmit={(e) => {
            e.preventDefault();
            const medication = Serializer.serialize(e.target, { hash: true });
            if (medication.patient && medication.visit && medication.medication && medication.prescription) {
              this.props.createMedication(medication);
            } else {
              // this.setState({ formError: true });
            }
          }}
        >
          <div className="form">
            <div className="columns">
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Status
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={visitOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Type
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={visitOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    With
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={visitOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
              <div className="column is-3">
                <div className="column">
                  <span className="header">
                    Location
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={visitOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column has-text-right">
                  <ClearButton />
                  <FilterButton />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column calendar-height">
                  <BigCalendar
                    events={appointments}
                    startAccessor="start"
                    endAccessor="end"
                    defaultDate={new Date()}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(AppointmentsCalendar);
