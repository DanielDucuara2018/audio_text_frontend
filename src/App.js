import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import GetTextAudio from './components/GetTextAudio';

const router = createBrowserRouter([
  {
    path: "/",
    element:       
    <div>
      <div>
        <GetTextAudio/>
      </div>
    </div>,
  },
]);

class App extends React.Component {
  render() {
    return (
      <>
      <RouterProvider router={router} />
     </>
    );
  }
}

export default App