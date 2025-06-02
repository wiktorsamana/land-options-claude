import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import PaymentsList from './PaymentsList';
import airtableService from '../services/airtableService';
import mockService from '../services/mockService';

// Fireworks component
const Fireworks = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style jsx>{`
        @keyframes firework1 {
          0% { opacity: 1; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
          100% { opacity: 0; transform: scale(1.2) rotate(360deg); }
        }
        @keyframes firework2 {
          0% { opacity: 1; transform: scale(0) rotate(0deg); }
          40% { opacity: 1; transform: scale(0.8) rotate(120deg); }
          100% { opacity: 0; transform: scale(1.5) rotate(240deg); }
        }
        @keyframes firework3 {
          0% { opacity: 1; transform: scale(0) rotate(0deg); }
          60% { opacity: 1; transform: scale(1.1) rotate(300deg); }
          100% { opacity: 0; transform: scale(1.8) rotate(720deg); }
        }
        .firework {
          position: absolute;
          font-size: 2rem;
          animation-duration: 2s;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .firework-1 { animation-name: firework1; color: #ff6b6b; top: 20%; left: 20%; }
        .firework-2 { animation-name: firework2; color: #4ecdc4; top: 30%; right: 25%; animation-delay: 0.3s; }
        .firework-3 { animation-name: firework3; color: #45b7d1; top: 60%; left: 30%; animation-delay: 0.6s; }
        .firework-4 { animation-name: firework1; color: #96ceb4; top: 50%; right: 30%; animation-delay: 0.9s; }
        .firework-5 { animation-name: firework2; color: #ffd93d; top: 70%; left: 60%; animation-delay: 1.2s; }
        .firework-6 { animation-name: firework3; color: #ff9ff3; top: 40%; left: 70%; animation-delay: 1.5s; }
      `}</style>
      <div className="firework firework-1">🎆</div>
      <div className="firework firework-2">✨</div>
      <div className="firework firework-3">🎇</div>
      <div className="firework firework-4">💫</div>
      <div className="firework firework-5">🌟</div>
      <div className="firework firework-6">⭐</div>
    </div>
  );
};

const BonusConverterPage = () => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('userId') || 'employee_001';
  
  const [totalSquaresConverted, setTotalSquaresConverted] = useState(0);
  const [lastConversion, setLastConversion] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  
  // Choose service based on Airtable configuration
  const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;

  const handlePaymentConverted = (payment, squaresEarned) => {
    setTotalSquaresConverted(prev => prev + squaresEarned);
    setLastConversion({
      payment: payment.description,
      squares: squaresEarned,
      timestamp: new Date()
    });
    
    // Trigger fireworks animation
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 3000); // Hide after 3 seconds
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
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">
                Conversion Successful!
              </p>
              <p className="text-sm">
                Converted "{lastConversion.payment}" into {lastConversion.squares} jungle plot squares! 🌴
              </p>
            </div>
            <span className="text-2xl">🎉</span>
          </div>
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

      {/* Fireworks Animation */}
      <Fireworks show={showFireworks} />
    </div>
  );
};

export default BonusConverterPage;