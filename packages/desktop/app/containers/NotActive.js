import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class NotActive extends Component {
  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Not Active Yet
            </span>
          </div>
          <div className="detail">
            <div className="notification">
              <span>
                This section is not activated yet.
                {' '}
                <Link to="/patients">Back to Patients</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default NotActive;
