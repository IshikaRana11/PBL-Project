import { useState } from "react";
import axios from "axios";
import "./style.css";

function App() {
  const [lispCode, setLispCode] = useState("");
  const [cCode, setCCode] = useState("");

  const handleConvert = async () => {
    try {
      const res = await axios.post("http://localhost:3001/convert", {
        code: lispCode,
      });
      console.log("Response data:", res.data); // Debug log
      setCCode(res.data.output);
    } catch (err) {
      console.error("Full error:", err); // Debug log
      if (err.response) {
        console.error("Response data:", err.response.data); // Debug log
        setCCode(
          "Error: " +
            (err.response.data.error || JSON.stringify(err.response.data))
        );
      } else {
        setCCode("Error: " + err.message);
      }
    }
  };

  return (
    <div className="container">
      <h1>Lisp to C Converter</h1>
      <textarea
        placeholder="Enter Lisp code here..."
        value={lispCode}
        onChange={(e) => setLispCode(e.target.value)}
      />
      <button onClick={handleConvert}>Convert</button>
      <h2>Generated C Code:</h2>
      <pre>{cCode}</pre>
    </div>
  );
}

export default App;
