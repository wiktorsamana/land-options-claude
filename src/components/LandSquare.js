import React from 'react';

const LandSquare = ({ x, y, isOwned, type, onClick, isHighlighted }) => {
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

  return (
    <div
      className={`
        land-square relative w-16 h-16 border-2 border-gray-300 cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-lg
        ${isOwned 
          ? 'bg-gradient-to-br from-green-200 to-green-300 border-green-400 shadow-lg' 
          : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-blue-100 hover:to-blue-200'
        }
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
      `}
      onClick={() => onClick(x, y)}
      title={isOwned ? `Land earned: ${type} (${x}, ${y})` : `Available land (${x}, ${y})`}
    >
      {getSquareContent()}
      {isOwned && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      )}
      
      {/* Coordinate overlay for debugging */}
      {/* Uncomment below to show coordinates or something in bottom right  */}
      {/* <div className="absolute bottom-0 right-0 text-xs text-gray-400 opacity-50">
        {x},{y}
      </div> */}
    </div>
  );
};

export default LandSquare;