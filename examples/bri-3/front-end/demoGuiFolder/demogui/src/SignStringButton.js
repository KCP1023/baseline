import React from 'react';
import generateAndSignString from './signString';

const SignStringButton = () => {
    
    const handleSigning = async () => {
        try {
            await generateAndSignString();
            alert('String generated and signed successfully!');
        } catch (error) {
            console.error('Error generating and signing string:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            <button onClick={handleSigning}>Generate And Sign String</button>
        </div>
    );
};

export default SignStringButton;
