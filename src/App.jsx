import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/landingPage/HomePage';
import Contact from './components/landingPage/Contact/Contact';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;