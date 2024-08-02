import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import GetTextAudio from './components/GetTextAudio';
import { store, persistor } from './Store';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div>
        <GetTextAudio />
      </div>
    ),
  },
]);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RouterProvider router={router} />
        </PersistGate>
      </Provider>
    );
  }
}

export default App;