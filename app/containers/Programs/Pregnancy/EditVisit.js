import React, { Component } from 'react';

class EditVisit extends Component {
  showAntenatal() {
    this.props.history.push('/programs/questionTable');
  }
  showGestantional() {
    this.props.history.push('/programs/questionsFirst');
  }
  showOnset() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  showPregnancy() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="details">
          <div className="pregnancy-top">
            <div className="columns">
              <div className="column pregnancy-name">
                <span className="pregnancy-name-title">
                  Name
                </span>
                <span className="pregnancy-name-details">
                  Jo Citizen
                </span>
              </div>
              <div className="column pregnancy-estimate">
                <span className="pregnancy-estimate-text">
                  Estimate date of conception:
                </span>
                <button className="button is-primary estimate-add-button " onClick={this.showAntenatal.bind(this)}>+(Add)</button>
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column pregnancy-button-details">
              <div className="pregnancy-options-title">Pregnancy 3: Options</div>
              <div className="button-details">
                <button className="button is-primary pregnancies-button " onClick={this.showAntenatal.bind(this)}>+Antenatal Visit</button>
              </div>
              <div className="button-details">
                <button className="button is-primary pregnancies-button " onClick={this.showGestantional.bind(this)}>Gestantional diabetes</button>
              </div>
              <div className="button-details">
                <button className="button is-primary pregnancies-button " onClick={this.showOnset.bind(this)}>Onset of labour</button>
              </div>
              <div className="button-details">
                <button className="button is-primary pregnancies-button " onClick={this.showPregnancy.bind(this)}>Pregnancy Outcomes</button>
              </div>
              <div className="button-details">
                <button className="button is-primary pregnancies-button " onClick={this.showPregnancy.bind(this)}>Postnatal Visit</button>
              </div>
            </div>
            <div className="column pregnancy-button-details">
              <div className="pregnancy-options-title">View previous visits</div>
              <div className="button-details">
                <button className="button is-info pregnancies-button " onClick={this.showAntenatal.bind(this)}>Patient reporting</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Antenatal Visit 1</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Antenatal Visit 2</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Postnatal Visit 1</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EditVisit;
