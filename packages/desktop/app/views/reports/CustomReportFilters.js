import React, { Component } from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import styled from 'styled-components';
import { withTheme, withStyles } from '@material-ui/core/styles';

import { reportLine, reportBar, reportPie, reportRaw, reportTable } from '../../constants/images';
import { REPORT_TYPES, Colors } from '../../constants';
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
const HorizontalList = styled(List)`
  display: flex;
`;
const VisualisationList = styled(HorizontalList)`
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
const StyledDatasetItem = styled(ListItem)`
  :hover {
    background-color: white !important;
  }
`;

const DatasetItem = withStyles({
  root: {
    backgroundColor: '#ffdb00',
    border: `1px solid ${Colors.primaryDark}`,
    borderRadius: 15,
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
    maxWidth: 150,
  },
  selected: {
    backgroundColor: `${Colors.white} !important`,
  },
})(StyledDatasetItem);

const GetVisualisationImage = value => {
  switch (value) {
    case REPORT_TYPES.PIE_CHART:
      return reportPie;
    case REPORT_TYPES.LINE_CHART:
      return reportLine;
    case REPORT_TYPES.BAR_CHART:
      return reportBar;
    case REPORT_TYPES.RAW:
      return reportRaw;
    case REPORT_TYPES.TABLE:
      return reportTable;
    default:
      return '';
  }
};
const VisualisationButton = ({ visualisation, selected, onClick }) => {
  const { label, value } = visualisation;
  return (
    <ListItem button title={label} onClick={() => onClick(value)} selected={selected === value}>
      <VisualisationImage src={GetVisualisationImage(value)} alt={label} />
    </ListItem>
  );
};

const DatasetButton = ({ dataset, selected, onClick }) => {
  const { label, value } = dataset;
  return (
    <DatasetItem button title={label} onClick={() => onClick(value)} selected={selected === value}>
      {label}
    </DatasetItem>
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

  setDataset = dataset => {
    this.setState({ dataset });
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
            <GroupTitle theme={theme}>Reporting on</GroupTitle>
            <HorizontalList style={{ paddingLeft: 50 }}>
              {datasetOptions.map(dataset => (
                <DatasetButton
                  key={dataset.value}
                  selected={this.state.dataset}
                  dataset={dataset}
                  onClick={this.setDataset}
                />
              ))}
            </HorizontalList>
          </Column>
        </Container>
        <Column style={{ textAlign: 'right', marginTop: '0.5em' }}>
          <Button
            onClick={this.apply}
            color="primary"
            disabled={!this.state.visualisation || !this.state.dataset}
          >
            Generate report
          </Button>
        </Column>
      </div>
    );
  }
}

export const CustomReportFilters = withTheme(CustomFilters);
