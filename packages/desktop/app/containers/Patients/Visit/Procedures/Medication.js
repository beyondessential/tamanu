import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { proceduresMedicationColumns } from '../../../../constants';
import MedicationModal from '../../components/MedicationModel';
import {
  Dialog, EditButton, DeleteButton, SimpleTable, TopBar,
  SubHeader, NewButton,
} from '../../../../components';

export default class Medication extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    medication: [],
    tableColumns: proceduresMedicationColumns,
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

  deleteItem = async () => {
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

  setActionsCol = (row) => (
    <div key={row._id}>
      <EditButton
        size="small"
        onClick={() => this.editItem(row.original._id)}
        can={{ do: 'update', on: 'medication' }}
      />
      <DeleteButton
        size="small"
        onClick={() => this.deleteConfirm(row.original._id)}
        can={{ do: 'delete', on: 'medication' }}
      />
    </div>
  )

  editItem = (itemId = null) => {
    this.setState({ modalVisible: true, action: (itemId !== null ? 'edit' : 'new'), itemId });
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  render() {
    const { procedureModel } = this.props;
    const {
      modalVisible, action, itemId, medication, tableColumns,
    } = this.state;
    return (
      <React.Fragment>
        <SubHeader title="Medication Used">
          <NewButton
            onClick={() => this.editItem()}
            can={{ do: 'create', on: 'medication' }}
          >
            Add Medication
          </NewButton>
        </SubHeader>
        <Grid container item>
          <SimpleTable
            data={medication}
            columns={tableColumns}
            emptyNotification="No medication found."
          />
        </Grid>
        <MedicationModal
          itemId={itemId}
          procedureModel={procedureModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
        />
        <Dialog
          dialogType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
      </React.Fragment>
    );
  }
}
