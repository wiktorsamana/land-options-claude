import React from 'react';
import { Loader } from 'lucide-react';

const RewardCard = ({ type, count, onClaim, isLoading }) => {
  const getRewardInfo = () => {
    switch (type) {
      case 'forest':
        return { 
          icon: '🌴', 
          name: 'Palm Tree', 
          description: 'Peaceful palmtree grove',
          bgColor: 'from-green-400 to-green-500',
          textColor: 'text-green-700'
        };
      case 'house':
        return { 
          icon: '🌿', 
          name: 'Jungle Plot', 
          description: 'Jungle house plot',
          bgColor: 'from-yellow-400 to-yellow-500',
          textColor: 'text-yellow-700'
        };
      case 'tree':
        return { 
          icon: '🌳', 
          name: 'Mango Tree', 
          description: 'Natural mango tree',
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
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold mb-3 ${reward.textColor} bg-yellow-100`}>
          <span className="mr-1">×</span>
          {count}
        </div>
        
        {/* Claim button */}
        <button
          onClick={() => onClaim(type)}
          disabled={isLoading || count <= 0}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform
            ${isLoading || count <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : `bg-gradient-to-r ${reward.bgColor} text-white hover:shadow-lg hover:scale-105 active:scale-95`
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Claiming...
            </div>
          ) : count <= 0 ? (
            'No rewards'
          ) : (
            'Claim Land'
          )}
        </button>
        
        {/* Availability indicator */}
        {count > 0 && !isLoading && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            ✓ Available to claim
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardCard;