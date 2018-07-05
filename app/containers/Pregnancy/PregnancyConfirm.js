import React, { Component } from 'react';

class PregnancyConfirm extends Component {
  confirmGestational() {
    this.props.history.push('/pregnancy/questionTable');
  }
  back() {
    this.props.history.push('/pregnancy');
  }

  showAntenatal() {
    this.props.history.push('/pregnancy/questionTable');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="confirm-details">
          <div className="columns title">
            <div className="confirm-name">
              <span className="confirm-name-title">
                Name
              </span>
              <span className="confirm-name-details">
                Jo Citizon
              </span>
            </div>
            <button className="button is-primary pregnancies-antenatal-button" onClick={this.showAntenatal.bind(this)}>Antenatal Visit</button>
          </div>
          <div className="text-details">
            <span>Please Confirm you are making a diagnosis of Gestational Diabetes in this patient:</span>
          </div>
          <div className="pregnancies-button">
            <button className="button is-primary pregnancies-gestational-button " onClick={this.confirmGestational.bind(this)}>Confirm <br />Gestational diabetes</button>
            <button className="button is-danger pregnancies-back-button " onClick={this.back.bind(this)}>Back</button>
          </div>
        </div>
      </div>
    );
  }
}

export default PregnancyConfirm;
