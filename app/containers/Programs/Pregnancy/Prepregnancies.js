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
          <span>
            Pregnancies
          </span>
        </div>
        <div className="details">
          <div className="pregnancy-top">
            <div className="pregnancy-name">
              <span className="pregnancy-name-title">
                Name
              </span>
              <span className="pregnancy-name-details">
                Jo Citizen
              </span>
            </div>
          </div>
          <div className="prepregnancies-table">
            <table className="table is-striped maternal__table is-fullwidth">
              <thead>
                <tr className="primary">
                  <th>Provious Pregnancies</th>
                  <th>Dates</th>
                  <th>Outcomes</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pregnancy1</td>
                  <td>1/1/17-30/9/17</td>
                  <td>Live Birth</td>
                  <td>
                    <button className="button is-info prepregnancies-button " onClick={this.showPregnancy.bind(this)}>View Child</button>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <button className="button is-warning prepregnancies-button " onClick={this.showPregnancy.bind(this)}>Edit Pregnancy</button>
                  </td>
                </tr>
                <tr>
                  <td>Pregnancy2</td>
                  <td>1/1/18-30/6/27</td>
                  <td>Miscarriage</td>
                  <td>
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pregnancy-button-details">
            <div className="button-details">
              <button className="button is-primary pregnancies-button " onClick={this.showPregnancy.bind(this)}>New Pregnancy</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Prepregnancies;
