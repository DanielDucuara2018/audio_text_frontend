import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AudioTranscription from './components/AudioTranscription';
import { store, persistor } from './Store';
import './App.css';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div className="loading">Loading...</div>} persistor={persistor}>
        <div className="app">
          <AudioTranscription />
        </div>
      </PersistGate>
    </Provider>
  );
};

export default App;