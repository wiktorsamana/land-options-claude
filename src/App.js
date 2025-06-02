import React from 'react';
import LandGameApp from './components/LandGameApp';
import BonusConverterPage from './components/BonusConverterPage';

function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  return (
    <div className="App">
      {path === '/bonus-converter' ? (
        <BonusConverterPage />
      ) : (
        <LandGameApp />
      )}
    </div>
  );
}

export default App;