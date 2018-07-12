import React, { Component } from 'react';
import { filter, get, clone } from 'lodash';
import { Link } from 'react-router-dom';
import moment from 'moment';
import ReactTable from 'react-table';
import { pregnancyColumns, dateFormat, pregnancyOutcomes } from '../../../constants';
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

  viewChild = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  setActionsCol = (row) => {
    const item = row.original;
    return (
      <div key={row._id}>
        <button className={`button is-primary m-r-5 is-outlined ${item.child === '' ? 'is-hidden' : ''}`} onClick={() => this.viewChild(item.child)}>View Child</button>
        <button className="button is-primary m-r-5 is-outlined" onClick={() => this.setState({ modalVisible: true, action: 'edit', item })}>Edit Pregnancy</button>
        <button className="button is-primary m-r-5 is-outlined" onClick={() => this.setState({ modalVisible: true, action: 'edit', item })}>Details</button>
      </div>
    );
  }

  render() {
    const { patient, model } = this.props;
    let { pregnancies } = patient;
    const {
      modalVisible,
      action,
      item,
    } = this.state;

    // Set actions col for our table
    const lastCol = pregnancyColumns[pregnancyColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    // Get items to display
    pregnancies = pregnancies.map((p, k) => {
      const _item = clone(p);
      _item.label = `Pregnancy ${k + 1}`;
      _item.conceiveDate = moment(_item.conceiveDate).format(dateFormat);
      if (_item.deliveryDate !== '') _item.deliveryDate = moment(_item.deliveryDate).format(dateFormat);
      _item.outcomeLabel = get(filter(pregnancyOutcomes, outcome => outcome.value === _item.outcome)[0], 'label');
      return _item;
    });

    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <a className="button is-primary is-pulled-right is-block" onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            + New Pregnancy
          </a>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {pregnancies.length === 0 ?
            <div className="notification">
              <span>
                No pregnancies found.
              </span>
            </div>
            :
            <div>
              <ReactTable
                keyField="_id"
                data={pregnancies}
                defaultPageSize={pregnancies.length}
                columns={pregnancyColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
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
