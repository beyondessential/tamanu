import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class History extends Component {
  render() {
    return (
      <div>
        <div className="column has-text-right">
          <button className="button is-primary" type="submit">New Note</button>
        </div>
        <div className="column">
          <div className="history-pane">
            <Link className="button admission" to="/patients">5/14/2018 - 5/16/2018 Admission</Link>
          </div>
        </div>
      </div>
    );
  }
}

export default History;
