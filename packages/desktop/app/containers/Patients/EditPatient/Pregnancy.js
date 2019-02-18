import React, { Component } from 'react';
import ReactTable from 'react-table';
import { pregnancyColumns, PREGNANCY_PROGRAM_ID } from '../../../constants';
import PregnancyModal from '../components/PregnancyModal';
import { Button } from '../../../components';

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
    const { pregnancies: pregnanciesCollection } = this.props.patientModel.attributes;
    const item = pregnanciesCollection.findWhere({ _id: row.original._id });
    this.setState({ modalVisible: true, action: 'edit', item });
  }

  setActionsCol = (row) => {
    const { patient } = this.props;
    const item = row.original;
    return (
      <div key={row._id}>
        {item.child &&
          <Button
            variant="outlined"
            onClick={() => this.viewPatient(item.child.id)}
          >View Child</Button>
        }
        {item.child &&
          <Button
            onClick={() => this.viewPatient(item.father.id)}
          >View Father</Button>
        }
        <Button
          onClick={() => this.editItem(row)}
        >Edit Pregnancy</Button>
        <Button
          to={`/programs/${PREGNANCY_PROGRAM_ID}/${patient._id}/surveys/module/${item._id}`}
        >Add Form</Button>
        <Button
          to={`/programs/${PREGNANCY_PROGRAM_ID}/${patient._id}/surveys/module/${item._id}`}
          disabled={item.surveyResponses.length <= 0}
        >View Forms</Button>
      </div>
    );
  }

  render() {
    const { patient, patientModel } = this.props;
    const pregnancies = patientModel.getPregnancies();
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
          patientModel={patientModel}
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
