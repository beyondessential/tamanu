import React, { Component } from 'react';
import { connect } from 'react-redux';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchLabs } from '../../actions/labs';
import { labsColumns } from '../../constants';

class LabRequests extends Component {
  componentDidMount() {
    this.props.fetchLabs();
  }
  render() {
    const { labs } = this.props;
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Lab Requests
            </span>
            {/* <div className="view-action-buttons">
              <button>
                + New Lab
              </button>
            </div> */}
          </div>
          <div className="detail">
            <BootstrapTable
              keyField="id"
              data={labs}
              columns={labsColumns}
              defaultSortDirection="asc"
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    labs: state.labs.labs
  };
}

const mapDispatchToProps = dispatch => ({
  fetchLabs: () => dispatch(fetchLabs()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LabRequests);
