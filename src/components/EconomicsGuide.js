import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, TrendingUp, Gift, Users, Target } from 'lucide-react';
import './EconomicsGuide.css';

const EconomicsGuide = ({ onClose, onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: "Welcome to Land Options",
      icon: <TrendingUp className="w-16 h-16 text-green-600 economics-guide-icon" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Land Options transforms employee bonuses into a gamified ownership experience, 
            creating long-term engagement and retention through virtual land acquisition.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Key Innovation</h4>
            <p className="text-green-700">
              Employees receive 2x value when converting bonuses to land, incentivizing 
              long-term thinking over immediate cash payouts.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "The Economics Model",
      icon: <Target className="w-16 h-16 text-blue-600 economics-guide-icon" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center value-card">
              <div className="text-2xl font-bold text-blue-800">$100</div>
              <div className="text-sm text-blue-600">Bonus Value</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center value-card">
              <div className="text-2xl font-bold text-green-800">$200</div>
              <div className="text-sm text-green-600">Land Value</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center value-card">
              <div className="text-2xl font-bold text-purple-800">2x</div>
              <div className="text-sm text-purple-600">Multiplier</div>
            </div>
          </div>
          <p className="text-gray-700">
            The 2x multiplier encourages employees to invest in the company's future, 
            reducing immediate cash outflow while building engagement.
          </p>
        </div>
      )
    },
    {
      title: "Land Types & Rewards",
      icon: <Gift className="w-16 h-16 text-purple-600 economics-guide-icon" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center p-4 bg-green-50 rounded-lg land-type-item">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">🌴</div>
                <div>
                  <span className="font-semibold text-lg">Jungle Plot</span>
                  <p className="text-sm text-gray-600">Your first land reward type</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-4xl mb-3">🎁</div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">More Benefits Coming Soon</h4>
                <p className="text-sm text-gray-600">
                  Additional land types and exclusive rewards will be unlocked as you progress
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-4">
            Start collecting your jungle plots and build your virtual land empire!
          </p>
        </div>
      )
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete && onComplete();
      onClose();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 economics-guide-backdrop">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden economics-guide-modal">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{pages[currentPage].title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center mt-4">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 mx-1 rounded-full transition-all ${
                  index === currentPage ? 'bg-blue-600 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="p-8 economics-guide-page" key={currentPage}>
          <div className="flex justify-center mb-6">
            {pages[currentPage].icon}
          </div>
          {pages[currentPage].content}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors economics-guide-button ${
              currentPage === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <button
            onClick={nextPage}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors economics-guide-button"
          >
            <span>{currentPage === pages.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EconomicsGuide;