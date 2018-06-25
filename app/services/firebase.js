import firebase from 'firebase/app';
import 'firebase/messaging';

const config = {
  apiKey: 'AIzaSyB1QpNACR86zfjVEgBpQiaqznIFd_fUaNI',
  authDomain: 'tamanu-6ac7d.firebaseapp.com',
  databaseURL: 'https://tamanu-6ac7d.firebaseio.com',
  projectId: 'tamanu-6ac7d',
  storageBucket: 'tamanu-6ac7d.appspot.com',
  messagingSenderId: '889083073051'
};

export default firebase.initializeApp(config);
