import shortid from 'shortid';
import SharedSettings from 'Shared/services/settings';

export class Settings extends SharedSettings {
  constructor(props) {
    super(props, {
      LAST_SYNC_IN: '0',
      LAST_SYNC_OUT: '0',
      CLIENT_ID: shortid.generate(),
      CLIENT_SECRET: '',
      FACILITY_ID: '',
      TEMP_DISPLAY_ID_SEQ: '0',
    });
  }
}
