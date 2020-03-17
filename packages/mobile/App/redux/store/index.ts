import { createStore, compose } from 'redux';
import Reactotron from '../../reactotron';
import reducer from '../ducks';

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

export const store = createStore(reducer, compose(Reactotron.createEnhancer!()));
