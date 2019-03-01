import React, { Component } from 'react';
import ReactTable from 'react-table';
import { proceduresMedicationColumns } from '../../../../constants';
import MedicationModal from '../../components/MedicationModel';
import { Modal, EditButton, DeleteButton, NewButton } from '../../../../components';

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
    const { procedureModel } = this.props;
    const { medication } = procedureModel.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ medication: medication.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { procedureModel } = newProps;
    const { medication } = procedureModel.attributes;
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
    const { procedureModel } = this.props;
    const { itemId } = this.state;
    try {
      const item = procedureModel.get('medication').findWhere({ _id: itemId });
      procedureModel.get('medication').remove({ _id: itemId });
      await procedureModel.save();
      await item.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  setActionsCol = (row) => {
    return (
      <div key={row._id}>
        <EditButton
          size="small"
          onClick={() => this.editItem(row.original._id)}
          can={{ do: 'update', on: 'medication' }} />
        <DeleteButton
          size="small"
          onClick={() => this.deleteConfirm(row.original._id)}
          can={{ do: 'delete', on: 'medication' }} />
      </div>
    );
  }

  render() {
    const { procedureModel } = this.props;
    const { modalVisible, action, itemId, medication, tableColumns } = this.state;
    return (
      <div>
        <div className="columns m-b-0 m-t-10">
          <div className="column visit-header">
            <span>Medication Used</span>
            <NewButton
              className="is-pulled-right"
              onClick={() => this.editItem()}
              can={{ do: 'create', on: 'medication' }}
            >Add Medication</NewButton>
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
        <MedicationModal
          itemId={itemId}
          procedureModel={procedureModel}
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
