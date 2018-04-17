import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Sidebar extends Component {
  render() {
    console.log('props', this.props);
    return (
      <div>
        <div className="sidebar">
          <Link className="header" to="/">
            <span>
              Tamanu
            </span>
          </Link>
          <div className="scroll-container">
            <Link className="item" to="/inventory">
              <span>
                Inventory
              </span>
            </Link>
            <Link className="item" to="/patients">
              <span>
                Patients
              </span>
            </Link>
            <Link className="item" to="/scheduling">
              <span>
                Scheduling
              </span>
            </Link>
            <Link className="item" to="/imaging">
              <span>
                Imaging
              </span>
            </Link>
            <Link className="item" to="/medication">
              <span>
                Medication
              </span>
            </Link>
            <Link className="item" to="/labs">
              <span>
                Labs
              </span>
            </Link>
            <Link className="item" to="/billing">
              <span>
                Billing
              </span>
            </Link>
            <Link className="item" to="/incident">
              <span>
                Incident
              </span>
            </Link>
            <Link className="item" to="/administration">
              <span>
                Administration
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
