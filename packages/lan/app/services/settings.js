import shortid from 'shortid';
import SharedSettings from 'SHared/services/settings';

export default class Settings extends SharedSettings {
  constructor(props) {
    super(props, {
      LAST_SYNC_IN: '0',
      LAST_SYNC_OUT: '0',
      CLIENT_ID: shortid.generate(),
      CLIENT_SECRET: '',
      HOSPITAL_ID: '',
      TEMP_DISPLAY_ID_SEQ: '0',
    });
  }
}
