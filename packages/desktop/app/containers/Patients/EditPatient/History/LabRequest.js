import React from 'react';
import moment from 'moment';
import { dateFormat } from '../../../../constants';

const LabRequest = ({ item, gotoItem }) => (
  <div className="history-pane m-b-25">
    <div className="header" onClick={() => gotoItem('labRequest', item)}>
      <span>
        {moment(item.requestedDate).format(dateFormat)}
      </span>
      {item.category.name}
      <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Lab</span>
    </div>
  </div>
)

export default LabRequest;