import logo from './logo.svg';
// App.js
import React from 'react';
import './App.css';
import ConnectWalletButton from './ConnectWalletButton'; // Import the button component
import Login from './Login'; // Import the Login component
import SignStringButton from './SignStringButton'; // Import the SignStringButton component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Login /> {/* Use the Login component */}
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <ConnectWalletButton /> {/*Use the button component*/}
        <SignStringButton /> {/* Include the SignStringButton component */}
        {/* <AccountBalance /> Use the AccountBalance component */}
      </header>
    </div>
  );
}

export default App;