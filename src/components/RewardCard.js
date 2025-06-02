import React from 'react';
import { Loader } from 'lucide-react';

const RewardCard = ({ type, count, onClaim, isLoading }) => {
  const wholeUnits = Math.floor(count);
  const decimalUnits = count - wholeUnits;
  const hasDecimals = decimalUnits > 0;
  
  const getRewardInfo = () => {
    switch (type) {
      case 'jungle plot':
        return { 
          icon: '🌴', 
          name: 'Jungle Plot', 
          description: 'Tropical jungle land',
          bgColor: 'from-green-400 to-green-500',
          textColor: 'text-green-700'
        };
      case 'flathouse':
        return { 
          icon: '🏡', 
          name: 'Flathouse', 
          description: 'Modern residential building',
          bgColor: 'from-yellow-400 to-yellow-500',
          textColor: 'text-yellow-700'
        };
      case 'flathouse mini':
        return { 
          icon: '🏠', 
          name: 'Flathouse Mini', 
          description: 'Compact residential unit',
          bgColor: 'from-emerald-400 to-emerald-500',
          textColor: 'text-emerald-700'
        };
      default:
        return { 
          icon: '📦', 
          name: 'Mystery Land', 
          description: 'Unknown parcel',
          bgColor: 'from-gray-400 to-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  const reward = getRewardInfo();

  return (
    <div className="bg-white rounded-lg p-4 border-2 border-dashed border-yellow-300 hover:border-yellow-400 transition-all duration-200 hover:shadow-md">
      <div className="text-center">
        {/* Icon with glow effect */}
        <div className="relative mb-3">
          <div className="text-4xl mb-1 filter drop-shadow-lg">{reward.icon}</div>
          <div className="absolute inset-0 text-4xl opacity-30 blur-sm">{reward.icon}</div>
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-1">{reward.name}</h3>
        <p className="text-xs text-gray-600 mb-3">{reward.description}</p>
        
        {/* Count badge */}
        <div className="mb-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${reward.textColor} bg-yellow-100`}>
            <span className="mr-1">×</span>
            {count.toFixed(2)}
          </div>
          {hasDecimals && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Claimable:</span> {wholeUnits} units
              </p>
              <p className="text-xs text-orange-600">
                <span className="font-medium">Partial:</span> {decimalUnits.toFixed(2)} units
              </p>
            </div>
          )}
        </div>
        
        {/* Claim button */}
        <button
          onClick={() => onClaim(type)}
          disabled={isLoading || wholeUnits <= 0}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform
            ${isLoading || wholeUnits <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : `bg-gradient-to-r ${reward.bgColor} text-white hover:shadow-lg hover:scale-105 active:scale-95`
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Claiming...
            </div>
          ) : wholeUnits <= 0 ? (
            hasDecimals ? 'Need full unit' : 'No rewards'
          ) : (
            `Claim ${wholeUnits} Land`
          )}
        </button>
        
        {/* Availability indicator */}
        {!isLoading && (
          <div className="mt-2 text-xs font-medium">
            {wholeUnits > 0 ? (
              <span className="text-green-600">✓ {wholeUnits} unit{wholeUnits > 1 ? 's' : ''} ready to claim</span>
            ) : hasDecimals ? (
              <span className="text-orange-600">⚠️ Need {(1 - decimalUnits).toFixed(2)} more for full unit</span>
            ) : (
              <span className="text-gray-500">Convert bonus to earn land</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardCard;