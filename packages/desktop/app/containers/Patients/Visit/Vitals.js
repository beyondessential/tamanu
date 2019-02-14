import React, { Component } from 'react';
import ReactTable from 'react-table';
import { vitalsColumns } from '../../../constants';
import VitalModal from '../components/VitalModal';
import { Modal, NewButton, EditButton, DeleteButton } from '../../../components';

class Vitals extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    vitals: [],
    tableColumns: vitalsColumns
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { model: Model } = this.props;
    const { vitals } = Model.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ vitals: vitals.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { vitals } = Model.attributes;
    this.setState({ vitals: vitals.toJSON() });
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
      const item = Model.get('vitals').findWhere({ _id: itemId });
      Model.get('vitals').remove({ _id: itemId });
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
        <EditButton
          size="small"
          onClick={() => this.editItem(row.original._id)}
          can={{ do: 'update', on: 'vital' }} />
        <DeleteButton
          size="small"
          onClick={() => this.deleteConfirm(row.original._id)} 
          can={{ do: 'delete', on: 'vital' }}/>
      </div>
    );
  }

  render() {
    const { model: Model } = this.props;
    const { modalVisible, action, itemId, vitals, tableColumns } = this.state;
    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <NewButton
            className="is-pulled-right"
            onClick={() => this.editItem()}
            can={{ do: 'create', on: 'vital' }}
          >Add Vitals</NewButton>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {vitals.length > 0 &&
            <ReactTable
              keyField="_id"
              data={vitals}
              pageSize={vitals.length}
              columns={tableColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          }
          {vitals.length <= 0 &&
            <div className="notification">
              <span> No vitals found. </span>
            </div>
          }
        </div>
        <VitalModal
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

export default Vitals;
