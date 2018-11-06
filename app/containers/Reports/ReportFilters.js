import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { DateRange } from '../../components/DateRange';
import { Button } from '../../components/Button';
import { Expander } from '../../components/Expander';

export class ReportFilters extends Component {

  state = {
    range: { },
    diagnosis: "",
  }
  
  static propTypes = {
    onApply: PropTypes.func.isRequired,
  }

  apply = () => {
    const { onApply } = this.props;
    if(onApply) {
      onApply(this.state);
    }
  }

  render() {
    return (
      <div>
        <div className="column">
          <Expander label={ isExpanded => !isExpanded ? "Advanced filters" : "Hide advanced filters" }>
            <span className="input-group-title">Diagnosis</span>
            <Select 
              name="diagnosis" 
              options={ ["1", "2", "3"].map(x => ({ value: x, label: x })) }
              onChange={ diagnosis => this.setState({ diagnosis }) } 
              value={ this.state.diagnosis }
              simpleValue
            />
          </Expander>
        </div>
        <DateRange
          name="range"
          onChange={ range => this.setState({ range }) } 
          value={ this.state.range }
        />
        <div className="column" style={ { textAlign: "right" } }>
          <Button onClick={ this.apply } primary>Generate report</Button>
        </div>
      </div>
    );
  }
}
