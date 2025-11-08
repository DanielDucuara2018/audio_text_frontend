import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import appReducer from './reducers/appReducer';

// Configuration object for redux-persist - only persist essential data
const persistConfig = {
  key: 'audioTranscription',
  storage,
  whitelist: ['jobs', 'settings', 'currentJob'], // Persist current job for recovery
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, appReducer);

const store = createStore(
  persistedReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const persistor = persistStore(store);

export { store, persistor };