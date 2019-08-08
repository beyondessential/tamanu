import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import { reportLine, reportBar, reportPie, reportRaw, reportTable } from '../../constants/images';

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
const VisualisationImage = styled.img`
  border: none;
  height: 65px;
  width: 130px;
`;
const VisualisationList = styled(List)`
  display: flex;
  > div {
    margin-left: auto;
    margin-right: auto;
    width: 165px;
  }
`;
const Container = styled.div`
  background-color: ${props => props.theme.palette.background.paper};
  padding: 10px;
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

const GetVisualisationImage = label => {
  switch (label) {
    case 'Pie chart':
      return reportPie;
    case 'Line graph':
      return reportLine;
    case 'Bar chart':
      return reportBar;
    case 'Raw data':
      return reportRaw;
    case 'Table':
      return reportTable;
    default:
      return reportBar;
  }
};
const VisualisationButton = ({ visualisation, selected, onClick }) => {
  const { label, value } = visualisation;
  return (
    <ListItem button title={label} onClick={() => onClick(value)} selected={selected === value}>
      <VisualisationImage src={GetVisualisationImage(label)} alt={label} />
    </ListItem>
  );
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

  setVisualisation = visualisation => {
    this.setState({ visualisation });
  };

  apply = () => {
    this.props.onApply(this.state);
  };

  render() {
    const { theme } = this.props;

    return (
      <div>
        <Container theme={theme}>
          <Column>
            <GroupTitle theme={theme}>Visualisation type</GroupTitle>
            <VisualisationList>
              {visualisationOptions.map(viz => (
                <VisualisationButton
                  key={viz.value}
                  selected={this.state.visualisation}
                  visualisation={viz}
                  onClick={this.setVisualisation}
                />
              ))}
            </VisualisationList>
            <LabeledSelect
              label="Dataset"
              name="dataset"
              options={datasetOptions}
              onChange={dataset => this.setState({ dataset })}
              value={this.state.dataset}
              simpleValue
              theme={theme}
            />
          </Column>
        </Container>
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
