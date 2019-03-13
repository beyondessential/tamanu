import React from 'react';
import moment from 'moment';
import { dateFormat } from '../../../../constants';

const ImagingRequest = ({ item, gotoItem }) => (
  <div className="history-pane m-b-25">
    <div className="header" onClick={() => gotoItem('imagingRequest', item)}>
      <span>
        {moment(item.requestedDate).format(dateFormat)}
      </span>
      {item.type.name}
      <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Imaging</span>
    </div>
  </div>
)

export default ImagingRequest;