import { useState } from 'react';
import axios from 'axios';
import './style.css';

function App() {
  const [lispCode, setLispCode] = useState('');
  const [cCode, setCCode] = useState('');

  const handleConvert = async () => {
    try {
      const res = await axios.post('http://localhost:3001/convert', {
        code: lispCode,
      });
      setCCode(res.data.output);
    } catch (err) {
      setCCode('Error: ' + err.response?.data?.error || err.message);
    }
  };

  return (
    <div className='container'>
      <h1>Lisp to C Converter</h1>
      <textarea
        placeholder='Enter Lisp code here...'
        value={lispCode}
        onChange={e => setLispCode(e.target.value)}
      />
      <button onClick={handleConvert}>Convert</button>
      <h2>Generated C Code:</h2>
      <pre>{cCode}</pre>
    </div>
  );
}

export default App;
