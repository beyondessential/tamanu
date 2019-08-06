import React, { Component } from 'react';

import { TopBar } from '../../components';

import { availableReports, dummyData, datasetA, datasetB } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters, CustomReportFilters } from './ReportFilters';

const ReportNotFound = ({ missingId }) => (
  <div>
    <TopBar title="Report not found" />
    <div className="detail">
      <div className="notification">
        Could not find report with id "{missingId}
        ".
      </div>
    </div>
  </div>
);

export class ReportGenerator extends Component {
  state = {
    filters: {},
  };

  getFilters = (reportId) => {
    const isCustomReport = reportId === 'custom-report';

    return isCustomReport ?
      <CustomReportFilters onApply={filters => this.setState({filters})}/> :
      <ReportFilters onApply={filters => this.setState({filters})}/>;
  }

  getData = (reportId, filters) => {
    const isCustomReport = reportId === 'custom-report';

    if (isCustomReport) {
      const { dataset } = filters;
      if (dataset) {
        if (dataset === 'dataset-a') {
          return datasetA;
        }
        if (dataset === 'dataset-b') {
          return datasetB;
        }
      }
    }
    
    return dummyData;
  }

  render() {
    const { match } = this.props;
    const { reportId } = match.params;
    const report = availableReports.find(r => r.id === reportId);

    if (!report) {
      return <ReportNotFound missingId={reportId} />;
    }

    return (
      <div>
        <TopBar title={report.name} />
        <div className="detail">
          {this.getFilters(reportId)}
          <hr />
          <ReportViewer report={report} data={this.getData(reportId, this.state.filters)} filters={this.state.filters} />
        </div>
      </div>
    );
  }
}
