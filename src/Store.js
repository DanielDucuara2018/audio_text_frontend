import { createStore, combineReducers } from 'redux';
import { composeWithDevTools } from '@redux-devtools/extension';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import getTextAudioReducer from './reducers/getTextAudioReducer';

// Configuration object for redux-persist
const persistConfig = {
  key: 'root',
  storage,
};

// Combine reducers and wrap them with persistReducer
const rootReducer = combineReducers({
  getTextAudio: persistReducer(persistConfig, getTextAudioReducer),
});

const store = createStore(rootReducer, composeWithDevTools());
const persistor = persistStore(store);

export { store, persistor };