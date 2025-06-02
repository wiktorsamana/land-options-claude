import React from 'react';
import LandGameApp from './components/LandGameApp';
import BonusConverterPage from './components/BonusConverterPage';
import InvestorConverterPage from './components/InvestorConverterPage';
import airtableService from './services/airtableService';
import mockService from './services/mockService';

function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  // Determine which service to use
  const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;
  
  const handleNavigateBack = () => {
    window.location.pathname = '/';
  };
  
  return (
    <div className="App">
      {path === '/bonus-converter' ? (
        <BonusConverterPage />
      ) : path === '/investor-converter' ? (
        <InvestorConverterPage 
          dataService={dataService}
          onNavigateBack={handleNavigateBack}
        />
      ) : (
        <LandGameApp />
      )}
    </div>
  );
}

export default App;