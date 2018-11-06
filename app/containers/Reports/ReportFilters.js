import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { DateRange } from '../../components/DateRange';
import { Button } from '../../components/Button';

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
        <Select 
          name="diagnosis" 
          options={ ["1", "2", "3"].map(x => ({ value: x, label: x })) }
          onChange={ diagnosis => this.setState({ diagnosis }) } 
          value={ this.state.diagnosis }
          simpleValue
        />
        <DateRange
          name="range"
          onChange={ range => this.setState({ range }) } 
          value={ this.state.range }
        />
        <Button onClick={ this.apply } primary>Apply</Button>
      </div>
    );
  }
}
