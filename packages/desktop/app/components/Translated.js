import React from 'react';
import Polyglot from 'node-polyglot';

// Import strings at build time
// for multiple locale support we will need to either update the build system or 
// refactor to use a run-time load
import en from '../../resources/strings/general-en.json';

// Similarly, put this in parse-time scope so that it can be leveraged by 
// things that need a string at parse time. 
const polyglot = new Polyglot();
polyglot.extend(en);

// Debug feature - hover over a Translated string to see its id
const SHOW_TRANSLATE_ID = process.env.NODE_ENV === 'development'
  || process.env.DEBUG_PROD === 'true';

export class Translated extends React.PureComponent {

  // Function to fetch a translated string. Implemented as a static method to 
  // increase friction in using this function instead of the component.
  static getTranslatedString(id, values) {
    return polyglot.t(id, values);
  }

  render() {
    const { id, values } = this.props;
    const text = Translated.getTranslatedString(id, values);

    if(SHOW_TRANSLATE_ID) {
      return <span title={`_t(${id})`}>{text}</span>;
    } else {
      return text;
    }
  }
}
