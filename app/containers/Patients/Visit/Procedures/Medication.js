import React, { Component } from 'react';
import ReactTable from 'react-table';
import { proceduresMedicationColumns } from '../../../../constants';
import MedicationModal from '../../components/MedicationModel';
import { Modal } from '../../../../components';

class Medication extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    medication: [],
    tableColumns: proceduresMedicationColumns
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { model: Model } = this.props;
    const { medication } = Model.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ medication: medication.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { medication } = Model.attributes;
    this.setState({ medication: medication.toJSON() });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem(itemId = null) {
    this.setState({ modalVisible: true, action: (itemId !== null ? 'edit' : 'new'), itemId });
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  async deleteItem() {
    const { model: Model } = this.props;
    const { itemId } = this.state;
    try {
      const item = Model.get('medication').findWhere({ _id: itemId });
      Model.get('medication').remove({ _id: itemId });
      await Model.save();
      await item.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  setActionsCol = (row) => {
    return (
      <div key={row._id}>
        <button type="button" className="button is-primary m-r-5 is-small" onClick={() => this.editItem(row.original._id)}>
          <i className="fa fa-pencil" />
          Edit
        </button>
        <button type="button" className="button is-danger m-r-5 is-small" onClick={() => this.deleteConfirm(row.original._id)}>
          <i className="fa fa-times" />
          Delete
        </button>
      </div>
    );
  }

  render() {
    const { model: Model } = this.props;
    const { modalVisible, action, itemId, medication, tableColumns } = this.state;
    return (
      <div>
        <div className="columns m-b-0 m-t-10">
          <div className="column visit-header">
            <span>Medication Used</span>
            <a className="button is-primary is-pulled-right is-block" onClick={() => this.editItem()}>
              <i className="fa fa-plus" />
              Add Medication
            </a>
          </div>
        </div>
        <div className="column">
          {medication.length > 0 &&
            <ReactTable
              keyField="_id"
              data={medication}
              pageSize={medication.length}
              columns={tableColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          }
          {medication.length <= 0 &&
            <div className="notification">
              <span> No medication found. </span>
            </div>
          }
        </div>
        <div className="column p-t-0 p-b-0">

          <div className="is-clearfix" />
        </div>
        <MedicationModal
          itemId={itemId}
          model={Model}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
        <Modal
          modalType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem.bind(this)}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
      </div>
    );
  }
}

export default Medication;
