import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import PaymentsList from './PaymentsList';
import airtableService from '../services/airtableService';
import mockService from '../services/mockService';

const BonusConverterPage = () => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('userId') || 'employee_001';
  
  const [totalSquaresConverted, setTotalSquaresConverted] = useState(0);
  const [lastConversion, setLastConversion] = useState(null);
  
  // Choose service based on Airtable configuration
  const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;

  const handlePaymentConverted = (payment, squaresEarned) => {
    setTotalSquaresConverted(prev => prev + squaresEarned);
    setLastConversion({
      payment: payment.description,
      squares: squaresEarned,
      timestamp: new Date()
    });
  };

  const handleBackToGame = () => {
    // Navigate back to main game with the same userId
    window.location.href = `/?userId=${userIdFromUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={handleBackToGame}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Land Game
        </button>
      </div>

      {/* Success Notification */}
      {lastConversion && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <p className="font-semibold">
            🎉 Converted "{lastConversion.payment}" into {lastConversion.squares} jungle plot squares!
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bonus to Land Converter</h1>
            <p className="text-gray-600">Convert your pending payments into valuable land parcels</p>
            {totalSquaresConverted > 0 && (
              <div className="mt-4 inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <span className="font-semibold">
                  Total Converted: {totalSquaresConverted} 🌴 squares
                </span>
              </div>
            )}
          </div>

          {/* Payments List */}
          <PaymentsList 
            userId={userIdFromUrl}
            dataService={dataService}
            onPaymentConverted={handlePaymentConverted}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-600">
        <p>Converting payments for: <span className="font-semibold">{userIdFromUrl}</span></p>
        <p className="mt-2">
          After conversion, return to the{' '}
          <button
            onClick={handleBackToGame}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Land Game
          </button>
          {' '}to claim your land squares!
        </p>
      </div>
    </div>
  );
};

export default BonusConverterPage;