import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calculator, AlertTriangle, X, Sliders } from 'lucide-react';
import './InvestorConverter.css';

const InvestorConverter = ({ userId, dataService, onInvestmentConverted }) => {
  const [investmentAmount, setInvestmentAmount] = useState(200000);
  const [conversion, setConversion] = useState({
    'jungle plot': 0,
    'flathouse': 0,
    'flathouse mini': 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  // Conversion rates and requirements
  const conversionRates = {
    'jungle plot': {
      multiplier: 2,
      squareValue: 2000,
      minTicket: 25000, // 25 units × $1000 per unit
      minUnits: 25,
      name: 'Jungle Plot',
      icon: '🌴',
      description: 'Tropical jungle land with 2x multiplier - minimum 25 units'
    },
    'flathouse': {
      multiplier: 1,
      squareValue: 150000,
      minTicket: 150000,
      minUnits: 1,
      name: 'Flathouse',
      icon: '🏢',
      description: 'Premium residential building - $150,000 per unit'
    },
    'flathouse mini': {
      multiplier: 1,
      squareValue: 100000,
      minTicket: 100000,
      minUnits: 1,
      name: 'Flathouse Mini',
      icon: '🏠',
      description: 'Compact residential unit - $100,000 per unit'
    }
  };

  const calculateConversionFromUnits = (units, landType) => {
    const rate = conversionRates[landType];
    const investmentRequired = units * rate.squareValue / rate.multiplier;
    const landValue = investmentRequired * rate.multiplier;
    
    return {
      investmentRequired: Math.floor(investmentRequired),
      landValue,
      squaresEarned: units,
      wholeSquares: Math.floor(units),
      decimalSquares: units - Math.floor(units)
    };
  };


  const getTotalAllocated = () => {
    return Object.entries(conversion).reduce((sum, [landType, units]) => {
      if (units > 0) {
        const calc = calculateConversionFromUnits(units, landType);
        return sum + calc.investmentRequired;
      }
      return sum;
    }, 0);
  };

  const getRemainingAmount = () => {
    return investmentAmount - getTotalAllocated();
  };

  const getConversionSummary = () => {
    const summary = {};
    let totalSquares = 0;
    let totalLandValue = 0;

    Object.entries(conversion).forEach(([landType, units]) => {
      if (units > 0) {
        const calc = calculateConversionFromUnits(units, landType);
        summary[landType] = {
          units,
          amount: calc.investmentRequired,
          ...calc,
          rate: conversionRates[landType]
        };
        totalSquares += calc.squaresEarned;
        totalLandValue += calc.landValue;
      }
    });

    return {
      breakdown: summary,
      totalSquares,
      totalLandValue,
      totalInvested: getTotalAllocated(),
      remaining: getRemainingAmount()
    };
  };

  const updateConversion = (landType, units) => {
    const rate = conversionRates[landType];
    
    if (units < 0) {
      units = 0;
    }
    
    // Check minimum units requirement
    if (units > 0 && units < rate.minUnits) {
      setError(`${rate.name} requires minimum ${rate.minUnits} units (minimum $${rate.minTicket.toLocaleString()} investment)`);
      return;
    }
    
    // Check if total doesn't exceed investment amount
    const newTotalCost = Object.entries(conversion).reduce((sum, [type, currentUnits]) => {
      const unitsToUse = type === landType ? units : currentUnits;
      if (unitsToUse > 0) {
        const tempCalc = calculateConversionFromUnits(unitsToUse, type);
        return sum + tempCalc.investmentRequired;
      }
      return sum;
    }, 0);
    
    if (newTotalCost > investmentAmount) {
      setError(`Total allocation would cost $${newTotalCost.toLocaleString()}, exceeding investment amount of $${investmentAmount.toLocaleString()}`);
      return;
    }
    
    setError(null);
    setConversion(prev => ({
      ...prev,
      [landType]: units
    }));
  };

  const handleQuickAllocation = (landType) => {
    const remaining = getRemainingAmount();
    const rate = conversionRates[landType];
    
    if (remaining < rate.minTicket) {
      setError(`Insufficient remaining amount for ${rate.name}. Need $${rate.minTicket.toLocaleString()}, have $${remaining.toLocaleString()}`);
      return;
    }
    
    // Calculate how many units we can buy with remaining amount
    const maxUnitsFromRemaining = Math.floor((remaining * rate.multiplier) / rate.squareValue);
    const newUnits = conversion[landType] + maxUnitsFromRemaining;
    
    updateConversion(landType, newUnits);
  };

  const resetConversion = () => {
    setConversion({
      'jungle plot': 0,
      'flathouse': 0,
      'flathouse mini': 0
    });
    setError(null);
  };

  const handleConvertClick = () => {
    const summary = getConversionSummary();
    
    if (summary.totalInvested === 0) {
      setError('Please allocate your investment to at least one land type');
      return;
    }
    
    if (summary.remaining > 0) {
      setError(`You have $${summary.remaining.toLocaleString()} unallocated. Please allocate all funds or adjust your investment amount.`);
      return;
    }
    
    setShowDisclaimer(true);
    setDisclaimerAccepted(false);
  };

  const handleConfirmConversion = async () => {
    if (!disclaimerAccepted) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setShowDisclaimer(false);
      
      const summary = getConversionSummary();
      
      // Convert each land type allocation
      for (const [landType, data] of Object.entries(summary.breakdown)) {
        await dataService.convertInvestmentToLand(
          userId,
          landType,
          data.amount,
          data.squaresEarned
        );
      }
      
      // Notify parent
      if (onInvestmentConverted) {
        onInvestmentConverted(summary);
      }
      
      // Reset form
      resetConversion();
      
    } catch (err) {
      console.error('Conversion error:', err);
      setError(`Failed to convert investment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = getConversionSummary();

  return (
    <div className="space-y-6">
      {/* Investment Amount Input */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600" />
          Investment Amount
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Investment ($)
            </label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              min="0"
              step="1000"
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${getRemainingAmount() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${getRemainingAmount().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Simulator */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Sliders className="w-6 h-6 mr-2 text-blue-600" />
          Conversion Simulator
        </h3>
        
        <div className="space-y-4">
          {Object.entries(conversionRates).map(([landType, rate]) => (
            <div key={landType} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{rate.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{rate.name}</h4>
                    <p className="text-sm text-gray-600">{rate.description}</p>
                    {rate.minUnits > 1 && (
                      <p className="text-xs text-orange-600 font-medium">
                        Min. investment: ${rate.minTicket.toLocaleString()} 
                        ({rate.minUnits} units)
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Units Selected</p>
                  <p className="text-lg font-bold text-blue-600">
                    {conversion[landType]} {rate.icon}
                  </p>
                  {conversion[landType] > 0 && (
                    <p className="text-sm text-gray-500">
                      ${calculateConversionFromUnits(conversion[landType], landType).investmentRequired.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              {landType === 'jungle plot' ? (
                // Slider for jungle plot
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-6">
                      Units to purchase (minimum 25 units)
                    </label>
                    <div className="flex items-center space-x-4 mt-8">
                      <span className="text-sm text-gray-600 min-w-[3rem]">0</span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max="150"
                          step="1"
                          value={conversion[landType]}
                          onChange={(e) => updateConversion(landType, Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, 
                              #e5e7eb 0%, 
                              #e5e7eb ${(25/150)*100}%, 
                              #3b82f6 ${(25/150)*100}%, 
                              #3b82f6 100%)`
                          }}
                        />
                        {/* Striped pattern overlay for disabled area */}
                        <div 
                          className="absolute top-0 bottom-0 left-0 h-2 rounded-l-lg pointer-events-none opacity-50"
                          style={{ 
                            width: `${(25/150)*100}%`,
                            background: `repeating-linear-gradient(
                              45deg,
                              transparent,
                              transparent 3px,
                              #9ca3af 3px,
                              #9ca3af 6px
                            )`
                          }}
                        />
                        {/* Minimum indicator line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-800 pointer-events-none"
                          style={{ left: `${(25/150)*100}%` }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                            Min: 25
                          </span>
                        </div>
                        {/* Value indicator */}
                        {conversion[landType] > 0 && conversion[landType] < 25 && (
                          <div 
                            className="absolute -top-6 text-xs font-bold text-gray-600 pointer-events-none"
                            style={{ left: `${(conversion[landType]/150)*100}%`, transform: 'translateX(-50%)' }}
                          >
                            ⚠️ {conversion[landType]}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">150</span>
                      <input
                        type="number"
                        value={conversion[landType]}
                        onChange={(e) => updateConversion(landType, Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                  
                  {/* Land size explanation */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h5 className="font-semibold text-blue-800 text-sm mb-2">🏞️ Land Size Calculator:</h5>
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><span className="font-medium">Base parcel:</span> 25 units = 400m² of land</p>
                      <p><span className="font-medium">Each additional unit:</span> +12m² of land</p>
                      {conversion[landType] >= 25 && (
                        <div className="mt-2 pt-2 border-t border-blue-300">
                          <p className="font-semibold text-blue-800">
                            Your selection: {conversion[landType]} units = {300 + (conversion[landType] - 25) * 12}m² of land
                          </p>
                          {conversion[landType] > 25 && (
                            <p className="text-blue-600">
                              (Base 300m² + {conversion[landType] - 25} × 12m² = {(conversion[landType] - 25) * 12}m² extra)
                            </p>
                          )}
                        </div>
                      )}
                      {conversion[landType] > 0 && conversion[landType] < 25 && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="font-semibold text-gray-600">
                            ⚠️ Minimum 25 units required for jungle plot
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleQuickAllocation(landType)}
                    disabled={getRemainingAmount() < rate.minTicket}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      getRemainingAmount() >= rate.minTicket
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Use Remaining Budget
                  </button>
                </div>
              ) : (
                // Number input for other land types
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Units to purchase
                    </label>
                    <input
                      type="number"
                      value={conversion[landType]}
                      onChange={(e) => updateConversion(landType, Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>
                  <button
                    onClick={() => handleQuickAllocation(landType)}
                    disabled={getRemainingAmount() < rate.minTicket}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      getRemainingAmount() >= rate.minTicket
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Use Remaining
                  </button>
                </div>
              )}
              
              {conversion[landType] > 0 && (
                <div className="mt-3 bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Investment Required:</span>
                    <span className="font-semibold text-red-600">
                      ${calculateConversionFromUnits(conversion[landType], landType).investmentRequired.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Land Value ({rate.multiplier}x):</span>
                    <span className="font-semibold text-green-600">
                      ${calculateConversionFromUnits(conversion[landType], landType).landValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Units Earned:</span>
                    <span className="font-semibold text-blue-600">
                      {conversion[landType]} {rate.icon}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button
            onClick={resetConversion}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Conversion Summary */}
      {summary.totalInvested > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-green-600" />
            Conversion Summary
          </h3>
          
          <div className="space-y-3">
            {Object.entries(summary.breakdown).map(([landType, data]) => (
              <div key={landType} className="flex justify-between items-center bg-white rounded p-3">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{data.rate.icon}</span>
                  <span className="font-medium">{data.rate.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    ${data.amount.toLocaleString()} → ${data.landValue.toLocaleString()} value
                  </p>
                  <p className="font-semibold text-blue-600">
                    {data.squaresEarned.toFixed(2)} squares
                  </p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-semibold">Total Investment:</span>
                <span className="text-xl font-bold">${summary.totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-semibold">Total Land Value:</span>
                <span className="text-xl font-bold text-green-600">${summary.totalLandValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Total Squares:</span>
                <span className="text-xl font-bold text-blue-600">{summary.totalSquares.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {summary.totalInvested > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <button
            onClick={handleConvertClick}
            disabled={isLoading || summary.remaining !== 0}
            className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all ${
              summary.remaining === 0 && !isLoading
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Converting Investment...
              </span>
            ) : summary.remaining > 0 ? (
              `Allocate Remaining $${summary.remaining.toLocaleString()}`
            ) : (
              <span className="flex items-center justify-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Convert ${summary.totalInvested.toLocaleString()} to Land
              </span>
            )}
          </button>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Investor Land Conversion Agreement</h3>
                <button
                  onClick={() => {
                    setShowDisclaimer(false);
                    setDisclaimerAccepted(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conversion Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Investment Conversion Summary:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">Total Investment:</span> <span className="font-semibold">${summary.totalInvested.toLocaleString()}</span></p>
                  <p><span className="text-gray-600">Total Land Value:</span> <span className="font-semibold text-green-600">${summary.totalLandValue.toLocaleString()}</span></p>
                  <p><span className="text-gray-600">Total Squares:</span> <span className="font-semibold text-blue-600">{summary.totalSquares.toFixed(2)}</span></p>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="font-medium mb-2">Breakdown:</p>
                    {Object.entries(summary.breakdown).map(([landType, data]) => (
                      <p key={landType} className="text-xs">
                        • {data.rate.name}: ${data.amount.toLocaleString()} → {data.squaresEarned.toFixed(2)} squares
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer Text */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Important Notice:</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-3">
                  <p>
                    By converting your investment to land squares, you are participating in the Investor Land Conversion Program. 
                    This action is <span className="font-semibold">final and cannot be reversed</span>.
                  </p>
                  <p>
                    Your investment will be allocated across the selected land types with their respective multipliers. 
                    Only whole squares can be claimed on the land map, but decimal squares will be tracked in your account.
                  </p>
                  <p>
                    Please review the complete terms and conditions of the Investor Land Conversion Program before proceeding.
                  </p>
                  <p>
                    <a 
                      href="https://example.com/investor-land-conversion-terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                    >
                      Read Full Terms and Conditions →
                    </a>
                  </p>
                </div>
              </div>

              {/* Checkbox */}
              <div className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="mt-1 mr-3 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the{' '}
                    <a 
                      href="https://example.com/investor-land-conversion-terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Investor Land Conversion Program Terms and Conditions
                    </a>
                    . I understand that this conversion is final and cannot be reversed.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisclaimer(false);
                    setDisclaimerAccepted(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConversion}
                  disabled={!disclaimerAccepted}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    disclaimerAccepted
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Investment Conversion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorConverter;