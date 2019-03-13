import React from 'react';
import moment from 'moment';
import { capitalize } from 'lodash';
import { dateFormat } from '../../../../constants';

const Medication = ({ item, gotoItem }) => (
  <div className="history-pane m-b-25">
    <div className="header" onClick={() => gotoItem('medication', item)}>
      <span>
      {
        `${moment(item.prescriptionDate).format(dateFormat)} ${(item.endDate != null
            ? ` - ${moment(item.endDate).format(dateFormat)}`
            : '')}`
      }
      </span>
      {capitalize(item.drug.name)}
      <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Medication</span>
    </div>
  </div>
)

export default Medication;