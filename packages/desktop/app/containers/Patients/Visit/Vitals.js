import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { vitalsColumns } from '../../../constants';
import VitalModal from '../components/VitalModal';
import {
  Dialog, NewButton, EditButton, DeleteButton,
  SimpleTable, TabHeader,
} from '../../../components';

export default class Vitals extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    vitals: [],
    tableColumns: vitalsColumns,
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { visitModel } = this.props;
    this.handleChange = this.handleChange.bind(this);
    visitModel.on('change', this.handleChange);

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;

    const { vitals } = visitModel.attributes;
    this.setState({ vitals: vitals.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { visitModel } = newProps;
    const { vitals } = visitModel.attributes;
    this.setState({ vitals: vitals.toJSON() });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  setActionsCol = (row) => (
    <div key={row._id}>
      <EditButton
        size="small"
        onClick={() => this.editItem(row.original._id)}
        can={{ do: 'update', on: 'vital' }}
      />
      <DeleteButton
        size="small"
        onClick={() => this.deleteConfirm(row.original._id)}
        can={{ do: 'delete', on: 'vital' }}
      />
    </div>
  )

  deleteItem = async () => {
    const { visitModel } = this.props;
    const { itemId } = this.state;
    try {
      const item = visitModel.get('vitals').findWhere({ _id: itemId });
      visitModel.get('vitals').remove({ _id: itemId });
      await visitModel.save();
      await item.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  editItem(itemId = null) {
    this.setState({ modalVisible: true, action: (itemId !== null ? 'edit' : 'new'), itemId });
  }

  handleChange() {
    const { visitModel } = this.props;
    const { vitals } = visitModel.changedAttributes();
    if (vitals) this.setState({ vitals: vitals.toJSON() });
  }

  render() {
    const { visitModel } = this.props;
    const {
      modalVisible, action, itemId, vitals, tableColumns,
    } = this.state;
    return (
      <React.Fragment>
        <Grid container>
          <TabHeader>
            <NewButton
              onClick={() => this.editItem()}
              can={{ do: 'create', on: 'vital' }}
            >
              Add Vitals
            </NewButton>
          </TabHeader>
          <Grid container item>
            <SimpleTable
              data={vitals}
              columns={tableColumns}
              emptyNotification="No vitals found."
            />
          </Grid>
        </Grid>
        <VitalModal
          itemId={itemId}
          visitModel={visitModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
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
