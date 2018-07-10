import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';
import { pregnancyColumns, pageSizes } from '../../../constants';
import PregnancyModal from '../components/PregnancyModal';

const pregnancies = [];

class Pregnancy extends Component {
  state = {
    modalVisible: false,
    action: 'new',
    item: null
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }
  render() {
    const { patient, model } = this.props;
    const { modalVisible, action, item } = this.state;
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
                manual
                keyField="_id"
                data={pregnancies}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.pregnancies}
                loading={this.state.loading}
                columns={pregnancyColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
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
