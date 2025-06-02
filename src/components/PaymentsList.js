import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowRight, Calendar, Tag, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentsList = ({ userId, dataService, onPaymentConverted }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [convertingPaymentId, setConvertingPaymentId] = useState(null);
  const [conversionResults, setConversionResults] = useState({});
  
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
    const squaresEarned = Math.floor(landValue / squareValue);
    const remainingValue = landValue % squareValue;
    const remainingCash = remainingValue / conversionMultiplier;
    
    return {
      landValue,
      squaresEarned,
      remainingCash
    };
  };

  const handleConvertPayment = async (payment) => {
    const conversion = calculateConversion(payment.amount);
    
    if (conversion.squaresEarned < 1) {
      alert('This payment amount is too small to convert. Minimum: $1000');
      return;
    }

    try {
      setConvertingPaymentId(payment.id);
      setError(null);

      // Convert the payment
      await dataService.convertPaymentToLand(
        payment.id,
        userId,
        'tree', // Palm tree
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
              <li>Example: $1,000 cash → $2,000 land value → 1 square</li>
              <li>Minimum conversion: $1,000</li>
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
                          {conversion.squaresEarned} 🌴
                        </span>
                      </div>
                    </div>
                    {conversion.remainingCash > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Remaining cash: ${conversion.remainingCash.toFixed(2)}
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
                      onClick={() => handleConvertPayment(payment)}
                      disabled={convertingPaymentId === payment.id || conversion.squaresEarned < 1}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        conversion.squaresEarned >= 1
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
                          Convert
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
              {payments.reduce((sum, p) => sum + calculateConversion(p.amount).squaresEarned, 0)} 🌴
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;