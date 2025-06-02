import React, { useState } from 'react';

const LandSquare = ({ x, y, isOwned, type, onClick, isHighlighted, earnedDate }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const getSquareContent = () => {
    if (!isOwned) return null;
    
    const baseStyle = "absolute inset-0 flex items-center justify-center text-2xl";
    
    switch (type) {
      case 'jungle plot':
        return <div className={`${baseStyle} text-green-600`}>🌴</div>;
      case 'flathouse':
        return <div className={`${baseStyle} text-yellow-600`}>🏢</div>;
      case 'flathouse mini':
        return <div className={`${baseStyle} text-green-500`}>🏠</div>;
      default:
        return <div className={`${baseStyle} text-gray-400`}>📦</div>;
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
    onClick(x, y);
  };

  const handleMouseLeave = () => {
    setIsFlipped(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div 
      className="relative w-16 h-16 perspective-1000"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`
          land-square cursor-pointer transition-all duration-500 transform-style-preserve-3d
          ${isFlipped ? 'absolute inset-0 w-20 h-20 -top-2 -left-2 z-30 rotate-y-180' : 'relative w-full h-full'}
        `}
        onClick={handleClick}
        title={isOwned ? `Land earned: ${type} (${x}, ${y})` : `Available land (${x}, ${y})`}
      >
        {/* Front side */}
        <div
          className={`
            absolute inset-0 w-full h-full border-2 rounded-lg transition-all duration-300 backface-hidden
            ${!isFlipped ? 'hover:scale-105' : ''}
            ${isOwned 
              ? 'bg-gradient-to-br from-green-200/70 to-green-300/70 border-green-400 shadow-lg backdrop-blur-sm' 
              : 'bg-gradient-to-br from-gray-100/40 to-gray-200/40 hover:from-blue-100/60 hover:to-blue-200/60 backdrop-blur-sm border-dashed border-gray-400'
            }
          `}
        >
          {getSquareContent()}
          {isOwned && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500/90 rounded-full border-2 border-white shadow-sm"></div>
          )}
        </div>

        {/* Back side - only show when flipped */}
        {isFlipped && (
          <div
            className={`
              absolute inset-0 w-full h-full border-2 rounded-lg
              flex flex-col items-center justify-center text-center p-2
              ${isOwned 
                ? 'bg-gradient-to-br from-green-100/95 to-green-200/95 border-green-400 shadow-lg backdrop-blur-sm' 
                : 'bg-gradient-to-br from-gray-100/95 to-gray-200/95 border-dashed border-gray-400 backdrop-blur-sm'
              }
            `}
          >
            {isOwned ? (
              <div className="text-center flip-text-content">
                <div className="text-sm font-semibold text-green-800 mb-1">Earned</div>
                <div className="text-sm text-green-700">{formatDate(earnedDate)}</div>
              </div>
            ) : (
              <div className="text-center flip-text-content">
                <div className="text-sm font-semibold text-gray-600 mb-1">Locked</div>
                <div className="text-xs text-gray-500 leading-tight">Claim more land to unlock</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandSquare;