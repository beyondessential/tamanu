import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Requests extends Component {
  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Medication Requests
            </span>
            <div className="view-action-buttons">
              <Link to="/medication/edit/new">
                + New Request
              </Link>
              <Link to="/medication/edit/dispense">
                Dispense Medication
              </Link>
              <Link to="/medication/return/new">
                Return Medication
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
                <BootstrapTable
                  keyField="id"
                  data={patients}
                  columns={parentColumns}
                  defaultSortDirection="asc"
                />
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}
