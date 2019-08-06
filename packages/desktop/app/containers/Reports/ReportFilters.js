import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import moment from 'moment';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { DateRange } from '../../components/DateRange';
import InputGroup from '../../components/InputGroup';
import { Button } from '../../components/Button';

import { sexOptions } from '../../constants';
import { diagnosisOptions, locationOptions, prescriberOptions } from './dummyReports';

import styled from 'styled-components';

const Column = styled.div`
  padding: 0rem;
`;

const GroupTitle = styled.span`
  color: $main-light-dark-color;
  display: inline-block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const LabeledSelect = ({ label, ...props }) => (
  <div>
    <GroupTitle>{label}</GroupTitle>
    <Select {...props} />
  </div>
);

const ExpanderSection = ({ heading, subheading, children, ...props }) => (
  <ExpansionPanel {...props}>
    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
      <div style={{ minWidth: '14em' }}>{heading}</div>
      <small>{subheading}</small>
    </ExpansionPanelSummary>
    <ExpansionPanelDetails>
      <div style={{ flexBasis: '100%' }}>{children}</div>
    </ExpansionPanelDetails>
  </ExpansionPanel>
);

export class ReportFilters extends Component {
  state = {
    range: {
      end: moment(),
      start: moment().subtract(30, 'days'),
    },
  };

  static propTypes = {
    onApply: PropTypes.func.isRequired,
  };

  apply = () => {
    this.props.onApply(this.state);
  };

  componentDidMount() {
    this.apply();
  }

  render() {
    return (
      <div>
        <Column>
          <ExpanderSection heading="Report details" defaultExpanded>
            <LabeledSelect
              label="Location"
              name="location"
              options={locationOptions}
              onChange={location => this.setState({ location })}
              value={this.state.location}
              simpleValue
            />
            <div style={{ display: 'flex', width: '100%' }}>
              <DateRange
                name="range"
                onChange={range => this.setState({ range })}
                value={this.state.range}
              />
            </div>
          </ExpanderSection>
          <ExpanderSection heading="Care information">
            <LabeledSelect
              label="Clinician"
              name="prescriber"
              options={prescriberOptions}
              onChange={prescriber => this.setState({ prescriber })}
              value={this.state.prescriber}
              simpleValue
            />
            <LabeledSelect
              label="Diagnosis"
              name="diagnosis"
              options={diagnosisOptions}
              onChange={diagnosis => this.setState({ diagnosis })}
              value={this.state.diagnosis}
              simpleValue
            />
          </ExpanderSection>
          <ExpanderSection heading="Patient demographics">
            <InputGroup
              className=""
              name="ageMin"
              type="number"
              label="Age (min)"
              value={this.state.ageMin}
              onChange={e => this.setState({ ageMin: e.target.value })}
            />
            <InputGroup
              className=""
              inputClass=""
              name="ageMax"
              type="number"
              label="Age (max)"
              value={this.state.ageMax}
              onChange={e => this.setState({ ageMax: e.target.value })}
            />
            <LabeledSelect
              name="sex"
              label="Sex"
              options={sexOptions}
              value={this.state.sex}
              onChange={sex => this.setState({ sex })}
              simpleValue
            />
          </ExpanderSection>
        </Column>
        <Column style={{ textAlign: 'right', marginTop: '0.5em' }}>
          <Button>Advanced filters</Button>{' '}
          <Button onClick={this.apply} primary>
            Generate report
          </Button>
        </Column>
      </div>
    );
  }
}
