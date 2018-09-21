import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Link } from 'react-router-dom';
import { pregnancyColumns } from '../../../constants';
import PregnancyModal from '../components/PregnancyModal';

class Pregnancy extends Component {
  state = {
    modalVisible: false,
    action: 'new',
    item: null
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  viewPatient = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  editItem = (row) => {
    const { pregnancies: pregnanciesCollection } = this.props.model.attributes;
    const item = pregnanciesCollection.findWhere({ _id: row.original._id });
    this.setState({ modalVisible: true, action: 'edit', item });
  }

  setActionsCol = (row) => {
    const { patient } = this.props;
    const item = row.original;
    return (
      <div key={row._id}>
        <button type="button" className={`button is-primary m-r-5 is-outlined ${item.child === '' ? 'is-hidden' : ''}`} onClick={() => this.viewPatient(item.child.id)}>View Child</button>
        <button type="button" className={`button is-primary m-r-5 is-outlined ${item.father === '' ? 'is-hidden' : ''}`} onClick={() => this.viewPatient(item.father.id)}>View Father</button>
        <button type="button" className="button is-primary m-r-5 is-outlined" onClick={() => this.editItem(row)}>Edit Pregnancy</button>
        <Link className="button is-primary m-r-5 is-outlined" to={`/programs/program_CDBralnev/${patient._id}/surveys/module/${item._id}`}> Add Form </Link>
        <Link className="button is-primary m-r-5 is-outlined" to={`/programs/program_CDBralnev/${patient._id}/surveys/module/${item._id}`} disabled={item.surveyResponses.length <= 0}> View Forms </Link>
      </div>
    );
  }

  render() {
    const { patient, model } = this.props;
    const pregnancies = model.getPregnancies();
    const {
      modalVisible,
      action,
      item,
    } = this.state;

    // Set actions col for our table
    const lastCol = pregnancyColumns[pregnancyColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <a className="button is-primary is-pulled-right is-block" onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            <i className="fa fa-plus" /> Add Pregnancy
          </a>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {pregnancies.length > 0 &&
            <div>
              <ReactTable
                keyField="_id"
                data={pregnancies}
                pageSize={pregnancies.length}
                columns={pregnancyColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            </div>
          }
          {pregnancies.length === 0 &&
            <div className="notification">
              <span>
                No pregnancies found.
              </span>
            </div>
          }
        </div>
        <PregnancyModal
          item={item}
          patient={patient}
          model={model}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Pregnancy;
