import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import moment from 'moment';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

import { DateRange } from '../../components/DateRange';
import InputGroup from '../../components/InputGroup';
import { Button } from '../../components/Button';

import { sexOptions } from '../../constants';
import { diagnosisOptions, locationOptions, prescriberOptions, datasetOptions, visualisationOptions } from './dummyReports';

const Column = styled.div`
  padding: 0rem;
`;

const GroupTitle = styled.span`
  color: ${props => props.theme.palette.primary.textMedium};
  display: inline-block;
  font-weight: bold;
  margin-bottom: 5px;
  margin-top: 8px;
`;

const LabeledSelect = ({ label, ...props }) => (
  <div>
    <GroupTitle theme={props.theme}>{label}</GroupTitle>
    <Select {...props} />
  </div>
);

LabeledSelect.propTypes = {
  label: PropTypes.string.isRequired,
  theme: PropTypes.shape({}).isRequired,
};

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

ExpanderSection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

ExpanderSection.defaultProps = {
  subheading: '',
};

class Filters extends Component {
  static propTypes = {
    onApply: PropTypes.func.isRequired,
    theme: PropTypes.shape({}).isRequired,
  };

  state = {
    range: {
      end: moment(),
      start: moment().subtract(30, 'days'),
    },
  };

  componentDidMount() {
    this.apply();
  }

  apply = () => {
    this.props.onApply(this.state);
  };

  render() {
    const { theme } = this.props;
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
              theme={theme}
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
              theme={theme}
            />
            <LabeledSelect
              label="Diagnosis"
              name="diagnosis"
              options={diagnosisOptions}
              onChange={diagnosis => this.setState({ diagnosis })}
              value={this.state.diagnosis}
              simpleValue
              theme={theme}
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
              theme={theme}
            />
          </ExpanderSection>
        </Column>
        <Column style={{ textAlign: 'right', marginTop: '0.5em' }}>
          <Button>Advanced filters</Button>
          {' '}
          <Button onClick={this.apply} color="primary">
            Generate report
          </Button>
        </Column>
      </div>
    );
  }
}

export const ReportFilters = withTheme()(Filters);

export class CustomReportFilters extends Component {
  static propTypes = {
    onApply: PropTypes.func.isRequired,
  };

  state = {};

  apply = () => {
    this.props.onApply(this.state);
  };

  componentDidMount() {
    this.apply();
  }

  render() {
    return (
      <div>
        <div className="column">
          <ExpanderSection heading="Report details" defaultExpanded>
            <LabeledSelect
              label="Dataset"
              name="dataset"
              options={datasetOptions}
              onChange={dataset => this.setState({ dataset })}
              value={this.state.dataset}
              simpleValue
            />
          </ExpanderSection>
          <ExpanderSection heading="Visualisation">
            <LabeledSelect
              label="Visualisation"
              name="visualisation"
              options={visualisationOptions}
              onChange={visualisation => this.setState({ visualisation })}
              value={this.state.visualisation}
              simpleValue
            />
          </ExpanderSection>
        </div>
        <div className="column" style={{ textAlign: 'right', marginTop: '-1em' }}>
          <Button onClick={this.apply} primary>
            Generate report
          </Button>
        </div>
      </div>
    );
  }
}