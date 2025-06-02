import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowRight, Calendar, Tag, CheckCircle, AlertCircle, X } from 'lucide-react';

const PaymentsList = ({ userId, dataService, onPaymentConverted }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [convertingPaymentId, setConvertingPaymentId] = useState(null);
  const [conversionResults, setConversionResults] = useState({});
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  
  const conversionMultiplier = 2;
  const squareValue = 2000;

  useEffect(() => {
    loadPayments();
  }, [userId]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pendingPayments = await dataService.getUserPendingPayments(userId);
      setPayments(pendingPayments);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load pending payments');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateConversion = (amount) => {
    const landValue = amount * conversionMultiplier;
    const squaresEarned = landValue / squareValue; // Now allows decimals
    const wholeSquares = Math.floor(squaresEarned);
    const decimalSquares = squaresEarned - wholeSquares;
    
    return {
      landValue,
      squaresEarned: squaresEarned, // Total with decimals (e.g., 1.25)
      wholeSquares: wholeSquares, // Only whole units (e.g., 1)
      decimalSquares: decimalSquares, // Decimal portion (e.g., 0.25)
      remainingCash: 0 // No remaining cash - everything converts
    };
  };

  const handleConvertClick = (payment) => {
    setPendingPayment(payment);
    setShowDisclaimer(true);
    setDisclaimerAccepted(false);
  };

  const handleConvertPayment = async () => {
    if (!pendingPayment || !disclaimerAccepted) return;
    
    const payment = pendingPayment;
    const conversion = calculateConversion(payment.amount);
    
    // No minimum anymore - even small amounts can convert to decimal units
    if (payment.amount <= 0) {
      alert('Invalid payment amount');
      return;
    }

    try {
      setConvertingPaymentId(payment.id);
      setError(null);
      setShowDisclaimer(false);

      // Convert the payment
      await dataService.convertPaymentToLand(
        payment.id,
        userId,
        'jungle plot', // Default employee conversion type
        conversion.squaresEarned
      );

      // Store conversion result
      setConversionResults(prev => ({
        ...prev,
        [payment.id]: {
          success: true,
          squaresEarned: conversion.squaresEarned,
          remainingCash: conversion.remainingCash
        }
      }));

      // Notify parent
      if (onPaymentConverted) {
        onPaymentConverted(payment, conversion.squaresEarned);
      }

      // Reload payments
      await loadPayments();

    } catch (err) {
      console.error('Conversion error:', err);
      setError(`Failed to convert payment: ${err.message}`);
    } finally {
      setConvertingPaymentId(null);
      setPendingPayment(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin text-3xl mb-2">⏳</div>
        <p className="text-gray-600">Loading pending payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Payments</h3>
        <p className="text-gray-600">You don't have any pending bonus payments to convert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 2X Multiplier Highlight Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-8 h-8 mr-3" />
          <h2 className="text-3xl font-bold">DOUBLE YOUR VALUE!</h2>
        </div>
        <p className="text-center text-lg font-semibold">
          🎯 Get a 2X MULTIPLIER when converting cash to land! 🎯
        </p>
        <p className="text-center text-sm mt-2 opacity-90">
          Every $1 in bonus becomes $2 in land value - that's 100% extra value!
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="font-bold text-green-600">2X MULTIPLIER</span> on all conversions (100% bonus!)</li>
              <li>Each palm tree square costs ${squareValue.toLocaleString()} in land value</li>
              <li>Example: $10 cash → $20 land value → 0.01 squares</li>
              <li>You accumulate decimal squares but can only claim whole units</li>
              <li>No minimum amount - convert any amount!</li>
            </ul>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Pending Payments</h3>
      
      <div className="space-y-3">
        {payments.map((payment) => {
          const conversion = calculateConversion(payment.amount);
          const isConverted = conversionResults[payment.id]?.success;
          
          return (
            <div 
              key={payment.id} 
              className={`bg-white border rounded-lg p-5 ${
                isConverted ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{payment.description}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {payment.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">
                        ${payment.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Conversion Preview */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded p-3 mt-3 border border-green-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">${payment.amount.toLocaleString()}</span>
                        <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">×2</span>
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">
                          ${conversion.landValue.toLocaleString()} value
                        </span>
                        <span className="text-gray-400">=</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {conversion.squaresEarned.toFixed(2)} 🌴
                        </span>
                      </div>
                    </div>
                    {conversion.decimalSquares > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold">{conversion.wholeSquares}</span> claimable squares + 
                        <span className="text-orange-600 font-semibold"> {conversion.decimalSquares.toFixed(2)}</span> partial square
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isConverted ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Converted</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConvertClick(payment)}
                      disabled={convertingPaymentId === payment.id || conversion.squaresEarned <= 0}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        conversion.squaresEarned > 0
                          ? 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {convertingPaymentId === payment.id ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⏳</span>
                          Converting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Convert to land
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-gray-100 to-green-100 rounded-lg p-4 mt-6 border border-green-300">
        <h4 className="font-semibold text-gray-800 mb-3">💰 Total Conversion Opportunity:</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Your pending cash:</span>
            <span className="font-bold text-xl">
              ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <div className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
              2X MULTIPLIER = 100% BONUS VALUE!
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Becomes land value:</span>
            <span className="font-bold text-xl text-green-600">
              ${(payments.reduce((sum, p) => sum + p.amount, 0) * 2).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-gray-700 font-semibold">Total land squares:</span>
            <span className="font-bold text-2xl text-green-600">
              {payments.reduce((sum, p) => sum + calculateConversion(p.amount).squaresEarned, 0).toFixed(2)} 🌴
            </span>
          </div>
          <div className="text-center text-xs text-gray-600 mt-2">
            <span className="font-semibold">
              {Math.floor(payments.reduce((sum, p) => sum + calculateConversion(p.amount).squaresEarned, 0))}
            </span> whole squares claimable + 
            <span className="text-orange-600 font-semibold">
              {' '}{(payments.reduce((sum, p) => sum + calculateConversion(p.amount).squaresEarned, 0) % 1).toFixed(2)}
            </span> partial
          </div>
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && pendingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Employee Conversion Plan Agreement</h3>
                <button
                  onClick={() => {
                    setShowDisclaimer(false);
                    setPendingPayment(null);
                    setDisclaimerAccepted(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conversion Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Conversion Summary:</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Payment:</span> <span className="font-semibold">{pendingPayment.description}</span></p>
                  <p><span className="text-gray-600">Amount:</span> <span className="font-semibold">${pendingPayment.amount.toLocaleString()}</span></p>
                  <p><span className="text-gray-600">Land Value (2x):</span> <span className="font-semibold text-green-600">${(pendingPayment.amount * 2).toLocaleString()}</span></p>
                  <p><span className="text-gray-600">Squares Earned:</span> <span className="font-semibold text-blue-600">{calculateConversion(pendingPayment.amount).squaresEarned.toFixed(2)} 🌴</span></p>
                </div>
              </div>

              {/* Disclaimer Text */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Important Notice:</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-3">
                  <p>
                    By converting your bonus payment to land squares, you are participating in the Employee Land Conversion Plan. 
                    This action is <span className="font-semibold">final and cannot be reversed</span>.
                  </p>
                  <p>
                    The converted amount will be allocated as land squares in your virtual land portfolio with a 
                    <span className="font-semibold text-green-600"> 2x multiplier benefit</span>. 
                    Only whole squares can be claimed on the land map, but decimal squares will be tracked in your account.
                  </p>
                  <p>
                    Please review the complete terms and conditions of the Employee Land Conversion Plan before proceeding.
                  </p>
                  <p>
                    <a 
                      href="https://example.com/employee-land-conversion-terms" 
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
                      href="https://example.com/employee-land-conversion-terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Employee Land Conversion Plan Terms and Conditions
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
                    setPendingPayment(null);
                    setDisclaimerAccepted(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertPayment}
                  disabled={!disclaimerAccepted}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    disclaimerAccepted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Conversion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsList;