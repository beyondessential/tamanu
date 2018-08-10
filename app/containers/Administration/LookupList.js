import React, { Component } from 'react';
import Select from 'react-select';
import { lookupOptions } from '../../constants';

class LookupList extends Component {
  state = {
    selectValue: 'Billing Categories',
  }

  updateValue = (newValue) => {
    this.setState({
      selectValue: newValue,
    });
  }

  render() {
    const { selectValue } = this.state;
    const filterdArray = lookupOptions.filter(option => option.value === selectValue)[0];
    // console.log(filterdArray && filterdArray.label);
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Lookup Lists
          </span>
        </div>
        <div className="create-container">
          <div className="form">
            <div className="columns">
              <div className="column is-4">
                <div className="column">
                  <span className="input-group-title">
                    Visit
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={lookupOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form margin-t-30">
            <div className="form-header">
              <span>
                {(filterdArray && filterdArray.label) || 'Billing Categories'}
              </span>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <div className="has-text-right">
                    <button className="button" type="submit">Add Value</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LookupList;
