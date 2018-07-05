import React, { Component } from 'react';

class EditVisit extends Component {
  showAntenatal() {
    this.props.history.push('/pregnancy/pregnancyConfirm');
  }
  showGestantional() {
    this.props.history.push('/pregnancy/pregnancyConfirm');
  }
  showOnset() {
    this.props.history.push('/pregnancy/pregnancyConfirm');
  }
  showPregnancy() {
    this.props.history.push('/pregnancy/pregnancyConfirm');
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
          <div className="pregnancy-name">
            <span className="pregnancy-name-title">
              Name
            </span>
            <span className="pregnancy-name-details">
              Jo Citizon
            </span>
          </div>
          <div className="pregnancy-button-details">
            <div className="button-details">
              <button className="button is-primary pregnancies-button " onClick={this.showAntenatal.bind(this)}>Antenatal Visit</button>
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
          </div>
        </div>
      </div>
    );
  }
}

export default EditVisit;
