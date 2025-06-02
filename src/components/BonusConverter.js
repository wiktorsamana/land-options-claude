import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, ArrowRight, DollarSign, MapPin, AlertCircle } from 'lucide-react';

const BonusConverter = ({ userId, dataService, onConversionComplete }) => {
  const [pendingBonus, setPendingBonus] = useState(1000); // Default $1000
  const [conversionMultiplier] = useState(2); // 2x multiplier
  const [squareValue] = useState(2000); // $2000 per square in land value
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);

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

      // Add the palm tree rewards to the user
      await dataService.addReward(userId, 'tree', squaresEarned);

      setConversionResult({
        originalBonus: pendingBonus,
        landValue: landValue,
        squaresEarned: squaresEarned,
        remainingCash: remainingCash
      });

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
            <p className="text-sm text-gray-600">Palm tree squares</p>
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-2">✅ Conversion Successful!</h4>
            <p className="text-sm text-green-700">
              You converted ${conversionResult.originalBonus.toLocaleString()} into {conversionResult.squaresEarned} land squares.
              {conversionResult.remainingCash > 0 && (
                <span> You have ${conversionResult.remainingCash.toFixed(2)} remaining in cash bonus.</span>
              )}
            </p>
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
    </div>
  );
};

export default BonusConverter;