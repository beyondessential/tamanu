import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { TopBar } from '../../components';

import { availableReports, dummyData } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';

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

export class ReportGenerator extends Component {
  static propTypes = {
    match: PropTypes.shape({ params: PropTypes.object.isRequired }).isRequired,
  };

  state = {
    filters: {},
  };

  updateState = filters => {
    this.setState({ filters });
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
          <ReportFilters onApply={this.updateState} />
          <hr />
          <ReportViewer report={report} data={dummyData} filters={this.state.filters} />
        </Detail>
      </div>
    );
  }
}
