import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, ArrowRight, DollarSign, MapPin, AlertCircle } from 'lucide-react';

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

const BonusConverter = ({ userId, dataService, onConversionComplete }) => {
  const [pendingBonus, setPendingBonus] = useState(1000); // Default $1000
  const [conversionMultiplier] = useState(2); // 2x multiplier
  const [squareValue] = useState(2000); // $2000 per square in land value
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);

  // Calculate conversion details
  const landValue = pendingBonus * conversionMultiplier;
  const squaresEarned = Math.floor(landValue / squareValue);
  const remainingValue = landValue % squareValue;
  const remainingCash = remainingValue / conversionMultiplier;

  const handleConversion = async () => {
    if (squaresEarned < 1) {
      setError('Insufficient bonus amount to convert. Need at least $1000.');
      return;
    }

    try {
      setIsConverting(true);
      setError(null);

      // Add the land rewards to the user
      await dataService.addReward(userId, 'jungle plot', squaresEarned);

      setConversionResult({
        originalBonus: pendingBonus,
        landValue: landValue,
        squaresEarned: squaresEarned,
        remainingCash: remainingCash
      });

      // Trigger fireworks animation
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000); // Hide after 3 seconds

      // Reset pending bonus to remaining cash
      setPendingBonus(remainingCash);

      // Notify parent component
      if (onConversionComplete) {
        onConversionComplete(squaresEarned);
      }

    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert bonus. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bonus to Land Converter</h2>
          <p className="text-gray-600">Convert your pending cash bonus into valuable land parcels</p>
        </div>

        {/* Conversion Calculator */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Input: Pending Bonus */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <DollarSign className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Pending Bonus</h3>
            </div>
            <div className="mb-3">
              <input
                type="number"
                value={pendingBonus}
                onChange={(e) => setPendingBonus(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-2xl font-bold text-gray-800 bg-white border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
                step="100"
                min="0"
              />
            </div>
            <p className="text-sm text-gray-600">Cash amount to convert</p>
          </div>

          {/* Multiplier */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Land Value Multiplier</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-3">{conversionMultiplier}x</p>
            <div className="flex items-center text-sm text-gray-600">
              <span>${pendingBonus.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 mx-2" />
              <span className="font-semibold text-green-600">${landValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Output: Land Squares */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Land Squares Earned</h3>
            </div>
            <div className="flex items-center mb-3">
              <span className="text-2xl font-bold text-blue-600">{squaresEarned}</span>
              <span className="text-lg ml-2">🌴</span>
            </div>
            <p className="text-sm text-gray-600">Jungle plot squares</p>
          </div>
        </div>

        {/* Conversion Details */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Conversion Summary:</h4>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Cash bonus:</span>
              <span className="font-semibold ml-2">${pendingBonus.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Land value (2x):</span>
              <span className="font-semibold ml-2">${landValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Squares earned:</span>
              <span className="font-semibold ml-2">{squaresEarned} squares</span>
            </div>
            <div>
              <span className="text-gray-600">Remaining cash:</span>
              <span className="font-semibold ml-2">${remainingCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each land square is valued at ${squareValue.toLocaleString()}</li>
                <li>Your cash bonus gets a {conversionMultiplier}x multiplier when converted to land</li>
                <li>Minimum conversion amount: $1,000 (earns 1 square)</li>
                <li>Partial amounts under ${squareValue.toLocaleString()} remain as cash</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Conversion Result */}
        {conversionResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <span className="text-2xl mr-2">🎉</span>
                Conversion Successful!
                <span className="text-2xl ml-2">🎉</span>
              </h4>
              <p className="text-sm text-green-700 font-medium">
                🌟 You converted ${conversionResult.originalBonus.toLocaleString()} into {conversionResult.squaresEarned} land squares! 🌟
                {conversionResult.remainingCash > 0 && (
                  <span className="block mt-1"> 💰 You have ${conversionResult.remainingCash.toFixed(2)} remaining in cash bonus.</span>
                )}
              </p>
              <div className="mt-3 flex items-center justify-center space-x-2">
                <span className="text-3xl animate-bounce">🌴</span>
                <span className="text-lg font-bold text-green-800">
                  +{conversionResult.squaresEarned} Jungle Plot Squares Added!
                </span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>🌴</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleConversion}
            disabled={isConverting || squaresEarned < 1}
            className={`px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
              squaresEarned >= 1
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isConverting ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Converting...
              </span>
            ) : (
              <span className="flex items-center">
                <ArrowRight className="w-5 h-5 mr-2" />
                Convert to Land ({squaresEarned} squares)
              </span>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>By converting your bonus to land, you're investing in your future with a {conversionMultiplier}x value multiplier!</p>
        </div>
      </div>

      {/* Fireworks Animation */}
      <Fireworks show={showFireworks} />
    </div>
  );
};

export default BonusConverter;