import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
// import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import { fetchOnePatient } from '../../actions/patients';

class EditPatient extends Component {
  state = {
    // formError: false,
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.fetchOnePatient(id);
  }

  // onCloseModal = () => {
  //   this.setState({ formError: false });
  // }

  render() {
    const { patient } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Edit Patient
            </span>
          </div>
          <form
            className="create-container"
            onSubmit={(e) => {
              e.preventDefault();
              const medication = Serializer.serialize(e.target, { hash: true });
              if (medication.patient && medication.visit && medication.medication && medication.prescription) {
                this.props.createMedication(medication);
              } else {
                // this.setState({ formError: true });
              }
            }}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <div className="column visit-header">
                    <span>
                      Visit Information
                    </span>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="columns">
                    <div className="column">
                      <div className="column">
                        <span>Name: </span>
                        <span>
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="column level-left">
                      <div className="card-info">
                        {patient.displayId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/patients">Return</Link>
                <button className="button is-primary" type="submit">Update</button>
              </div>
            </div>
          </form>
        </div>
        {/* <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patient: state.patients.onePatient
  };
}

const mapDispatchToProps = dispatch => ({
  fetchOnePatient: id => dispatch(fetchOnePatient(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
