import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectsPage from './pages/ProjectsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
