import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import Serializer from '../../utils/form-serialize';
import { createMedication } from '../../actions/medications';
import { visitOptions } from '../../constants';

class UserRoles extends Component {
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
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              User Roles
            </span>
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
                <div className="column">
                  <div className="column">
                    <span className="header">
                      Role
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
              <div className="column has-text-right">
                <button className="button is-primary" type="submit">Update</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(UserRoles);
