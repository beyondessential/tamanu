import React, { Component } from 'react';

import { TopBar } from '../../components';

import { availableReports, dummyData } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';

import styled from 'styled-components';

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
      <Notification>
        Could not find report with id "{missingId}
        ".
      </Notification>
    </Detail>
  </div>
);

export class ReportGenerator extends Component {
  state = {
    filters: {},
  };

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
        <Detail>
          <ReportFilters onApply={filters => this.setState({ filters })} />
          <hr />
          <ReportViewer report={report} data={dummyData} filters={this.state.filters} />
        </Detail>
      </div>
    );
  }
}
