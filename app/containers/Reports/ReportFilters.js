import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { DateRange } from '../../components/DateRange';
import InputGroup from '../../components/InputGroup';
import { Button } from '../../components/Button';

import { sexOptions } from '../../constants';
import { diagnosisOptions, locationOptions } from './dummyReports';


const LabeledSelect = ({ label, ...props }) => (
  <div>
    <span className="input-group-title">{ label }</span>
    <Select { ...props } />
  </div>
);

const ExpanderSection = ({ heading, subheading, children, ...props }) => (
  <ExpansionPanel {...props}>
    <ExpansionPanelSummary expandIcon={ <ExpandMoreIcon /> }>
      <div style={ { minWidth: '14em' } }>{ heading }</div>
      <small>{ subheading }</small>
    </ExpansionPanelSummary>
    <ExpansionPanelDetails>
      <div style={{ flexBasis: '100%' }}>
        { children }
      </div>
    </ExpansionPanelDetails>
  </ExpansionPanel>
);

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
          <ExpanderSection heading="Report details" defaultExpanded>
            <LabeledSelect 
              label="Location"
              name="location" 
              options={ locationOptions }
              onChange={ diagnosis => this.setState({ diagnosis }) } 
              value={ this.state.diagnosis }
              simpleValue
            />
            <div style={{ display: 'flex', width: '100%', }}>
              <DateRange
                name="range"
                onChange={ range => this.setState({ range }) } 
                value={ this.state.range }
              />
            </div>
          </ExpanderSection>
          <ExpanderSection heading="Diagnosis">
            <LabeledSelect 
              label="Diagnosis"
              name="diagnosis" 
              options={ diagnosisOptions }
              onChange={ diagnosis => this.setState({ diagnosis }) } 
              value={ this.state.diagnosis }
              simpleValue
            />
          </ExpanderSection>
          <ExpanderSection heading="Patient demographics">
            <InputGroup 
              name="ageMin"
              label="Age (min)" 
              value={ this.state.ageMin }
              onChange={ e => this.setState({ ageMin: e.target.value }) }
            />
            <InputGroup 
              name="ageMax"
              label="Age (max)" 
              value={ this.state.ageMax }
              onChange={ e => this.setState({ ageMax: e.target.value }) }
            />
            <LabeledSelect 
              name="sex"
              label="Sex"
              options={ sexOptions }
              value={ this.state.sex }
              onChange={ sex => this.setState({ sex }) }
            />
          </ExpanderSection>
        </div>
        <div className="column" style={ { textAlign: "right", marginTop: '-1em' } }>
          <Button onClick={ this.apply } primary>Generate report</Button>
        </div>
      </div>
    );
  }
}
