import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Scanning from "./pages/Scanning";
import Verdict from "./pages/Verdict";
import Agent from "./pages/Agent";
import Monitor from "./pages/Monitor";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/commerce" replace />} />
          <Route path="/commerce" element={<Landing />} />
          <Route path="/commerce/scanning" element={<Scanning />} />
          <Route path="/commerce/verdict" element={<Verdict />} />
          <Route path="/commerce/agent" element={<Agent />} />
          <Route path="/commerce/monitor" element={<Monitor />} />
          <Route path="*" element={<Navigate to="/commerce" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
