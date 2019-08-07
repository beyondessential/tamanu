import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { TopBar } from '../../components';

import { availableReports, datasetOptions, generateData } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters, CustomReportFilters } from './ReportFilters';

const Detail = styled.div`
  padding: 10px;
`;
const Notification = styled.div`
  padding: 10px;
  background: #ffffe4;
`;

const ReportNotFound = ({ missingId }) => (
  <div>
    <TopBar title="Report not found" />
    <Detail>
      <Notification>{`Could not find report with id ${missingId}.`}</Notification>
    </Detail>
  </div>
);

ReportNotFound.propTypes = {
  missingId: PropTypes.string.isRequired,
};

const Report = ({reportName, reportFilters, reportViewer}) => (
  <div>
    <TopBar title={reportName} />    
    <div className="detail">
      {reportFilters}
      <hr/>
      {reportViewer}
    </div>
  </div>
);

export class ReportGenerator extends Component {
  static propTypes = {
    match: PropTypes.shape({ params: PropTypes.object.isRequired }).isRequired,
  };
  constructor(props) {
    super(props);

    const datasets = datasetOptions.reduce((acc, { value: dataset }) => ({[dataset]: generateData(), ...acc}),{});
    const filters = {};

    this.state = { datasets, filters }
  };

  updateState = filters => {
    this.setState({ filters });
  };
  getReportId = () => {
    const { match } = this.props;
    const { params } = match;
    const { reportId } = params;

    return reportId;
  }

  getData = () => {
    const { datasets, filters } = this.state;
    const { dataset } = filters;
    return dataset ? datasets[dataset] : Object.values(datasets)[0];
  }

  getReport = () => {
    const reportId = this.getReportId();
    return availableReports.find(r => r.id === reportId);
  }

  getReportFilters = () => {
    const reportId = this.getReportId();
    return reportId === 'custom-report' ? 
      <CustomReportFilters onApply={filters => this.setState({filters})}/> :
      <ReportFilters onApply={filters => this.setState({filters})}/>;
  }

  getReportViewer = () => {
    const { filters } = this.state;
    const report = this.getReport();
    const data = this.getData();
    return <ReportViewer report={report} data={data} filters={filters}/>;
  }

  render() {
    const report = this.getReport();

    if (!report) {
      const id = this.getReportId();
      return <ReportNotFound missingId={id} />;
    } 

    const { name: reportName } = report;
    const reportFilters = this.getReportFilters();
    const reportViewer = this.getReportViewer();

    return <Report reportName={reportName} reportFilters={reportFilters} reportViewer={reportViewer}/>
  }
}
