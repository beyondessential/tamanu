import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

import { Button } from '../../components/Button';

import { datasetOptions, visualisationOptions } from './dummyReports';

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

class CustomFilters extends Component {
  static propTypes = {
    onApply: PropTypes.func.isRequired,
    theme: PropTypes.shape({}).isRequired,
  };

  state = {};

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
              label="Dataset"
              name="dataset"
              options={datasetOptions}
              onChange={dataset => this.setState({ dataset })}
              value={this.state.dataset}
              simpleValue
              theme={theme}
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
              theme={theme}
            />
          </ExpanderSection>
        </Column>
        <Column style={{ textAlign: 'right', marginTop: '0.5em' }}>
          <Button onClick={this.apply} color="primary">
            Generate report
          </Button>
        </Column>
      </div>
    );
  }
}

export const CustomReportFilters = withTheme()(CustomFilters);
