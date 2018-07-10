import React, { Component } from 'react';

class Prepregnancies extends Component {
  showAntenatal() {
    this.props.history.push('/programs/pregnancyVisit');
  }
  showGestantional() {
    this.props.history.push('/programs/pregnancyVisit');
  }
  showOnset() {
    this.props.history.push('/programs/pregnancyVisit');
  }
  showPregnancy() {
    this.props.history.push('/programs/pregnancyVisit');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <div className="view-action-buttons">
            <Link to="/patients/edit/new">
              + New Patient
            </Link>
          </div>
        </div>
        <div className="detail">
          {patients.length === 0 ?
            <div className="notification">
              <span>
                No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
            :
            <div>
              <ReactTable
                manual
                keyField="_id"
                data={patients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                loading={this.state.loading}
                columns={patientColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Prepregnancies;
