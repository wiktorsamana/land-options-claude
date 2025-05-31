import React from 'react';

const ProgressBar = ({ current, total, label, color = "blue" }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500'
    };
    
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">{current}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`${getColorClasses(color)} h-3 rounded-full transition-all duration-500 ease-out relative`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-20 animate-pulse"></div>
        </div>
      </div>
      
      {/* Percentage display */}
      <div className="flex justify-end">
        <span className="text-xs text-gray-500">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;