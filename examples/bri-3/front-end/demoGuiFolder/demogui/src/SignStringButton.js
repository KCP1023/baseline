import React from 'react';
import GenerateAndSignString from './signString'; // Adjust the import path as necessary

function SignStringButton() {
 return (
    <div>
      <button onClick={GenerateAndSignString}>Generate and Sign String</button>
    </div>
 );
}

export default SignStringButton;