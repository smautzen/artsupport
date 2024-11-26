import React from 'react';
import axios from 'axios';

function App() {
  const sendData = async () => {
    try {
      const response = await axios.post('http://localhost:4000/create', {
        name: 'Test Entry',
      });
      console.log('Document created with ID:', response.data.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Creativity Support Tool</h1>
      <button onClick={sendData}>Create Entry</button>
    </div>
  );
}

export default App;
