import React, { useState, useEffect } from 'react';
import { Trophy, MapPin, Gift, Zap, Target, Loader, RefreshCw, Users, Settings } from 'lucide-react';

// Import services
import airtableService from '../services/airtableService';
// import airtableServiceLegacy from '../services/airtableServiceLegacy'; // Uncomment if using legacy
import mockService from '../services/mockService';

// Components
import LandSquare from './LandSquare';
import ProgressBar from './ProgressBar';
import RewardCard from './RewardCard';
import UserSelector from './UserSelector';

// Debug credentials in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Check:');
  console.log('Base ID:', process.env.REACT_APP_AIRTABLE_BASE_ID ? '✅ Found' : '❌ Missing');
  console.log('Access Token:', process.env.REACT_APP_AIRTABLE_ACCESS_TOKEN ? '✅ Found' : '❌ Missing');
}

export default function LandGameApp() {
  const [gameData, setGameData] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("employee_001"); // Default user
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Choose service based on Airtable configuration
  const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;
  const isUsingMockData = !airtableService.isAirtableConnected();

  // Load initial data
  useEffect(() => {
    loadGameData();
  }, [currentUserId]); // Reload when user changes

  const handleUserChange = (newUserId) => {
    setCurrentUserId(newUserId);
    setGameData(null); // Clear current data
    setSelectedSquare(null);
    setError(null);
  };

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Debug: Check what's in the rewards table
      if (dataService.debugRewardsTable) {
        console.log('🔍 Running rewards table debug...');
        await dataService.debugRewardsTable();
      }
      
      const data = await dataService.getGameData(currentUserId);
      setGameData(data);
    } catch (err) {
      console.error('Error loading game data:', err);
      setError(isUsingMockData 
        ? 'Failed to load game data. Please try again.' 
        : 'Failed to connect to Airtable. Check your configuration and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 FORCE REFRESH: Refreshing data for user:', currentUserId, 'at', new Date().toISOString());
      
      // Add a small delay to ensure fresh API calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await dataService.getGameData(currentUserId);
      console.log('📊 FORCE REFRESH: New game data loaded:', {
        user: data.userName,
        landSquares: data.ownedSquares.length,
        rewards: data.availableRewards.length,
        timestamp: new Date().toISOString()
      });
      
      setGameData(data);
      
      // Force a re-render by clearing and setting game data
      setTimeout(() => {
        console.log('✅ FORCE REFRESH: Data updated in UI');
      }, 100);
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSquareClick = (x, y) => {
    setSelectedSquare({ x, y });
  };

  const handleClaimReward = async (rewardType) => {
    if (!gameData || claimingReward) return;
    
    const reward = gameData.availableRewards.find(r => r.type === rewardType);
    if (!reward || reward.count <= 0) return;

    try {
      setClaimingReward(rewardType);

      // Find next available square
      const findNextSquare = () => {
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            const isOwned = gameData.ownedSquares.some(sq => sq.x === x && sq.y === y);
            if (!isOwned) return { x, y };
          }
        }
        return null;
      };

      const nextSquare = findNextSquare();
      if (!nextSquare) {
        alert('No available squares left! You\'ve completed your land parcel! 🎉');
        return;
      }

      // Claim the land square
      const newSquare = await dataService.claimLandSquare(
        currentUserId, 
        nextSquare.x, 
        nextSquare.y, 
        rewardType
      );

      // Update reward count
      await dataService.updateRewardCount(
        currentUserId, 
        rewardType, 
        reward.count - 1
      );

      // Update local state
      setGameData(prev => ({
        ...prev,
        ownedSquares: [...prev.ownedSquares, newSquare],
        availableRewards: prev.availableRewards.map(r => 
          r.type === rewardType ? { ...r, count: r.count - 1 } : r
        ),
        nextParcelProgress: prev.nextParcelProgress + 1
      }));

      // Show celebration
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      
      // Check if parcel is complete
      if (gameData.ownedSquares.length + 1 === 25) {
        setTimeout(() => {
          alert('🎉 Congratulations! You\'ve completed your first land parcel! 🏆');
        }, 2500);
      }
      
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError('Failed to claim reward. Please try again.');
    } finally {
      setClaimingReward(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-lg text-gray-600">Loading your land empire...</p>
          {isUsingMockData && (
            <p className="text-sm text-orange-600 mt-2">Using demo data - Configure Airtable for real data</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={loadGameData}
              className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Again
            </button>
            {!isUsingMockData && (
              <p className="text-xs text-gray-500">
                Make sure your .env file has valid Airtable credentials
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) return null;

  const ownedSquaresCount = gameData.ownedSquares.length;
  const completionPercentage = Math.round((ownedSquaresCount / 25) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Land Claimed!</h2>
            <p className="text-gray-600">Your Parcel is growing!</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏞️ Land Empire</h1>
          <p className="text-lg text-gray-600">Collect land, build your Parcel, earn rewards!</p>
          
          {/* User Selector and Admin Button */}
          <div className="mt-6 flex justify-center items-center space-x-4">
            <UserSelector 
              currentUserId={currentUserId}
              onUserChange={handleUserChange}
              dataService={dataService}
            />
            
            {/* Admin Panel Button */}
            <button
              onClick={() => setShowAdminPanel(true)}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-md"
              title="Open Admin Panel"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
          
          {/* Connection Status */}
          <div className="mt-4 flex justify-center space-x-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isUsingMockData 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isUsingMockData ? 'bg-orange-500' : 'bg-green-500'
              }`}></div>
              {isUsingMockData ? 'Demo Mode' : 'Connected to Airtable'}
            </div>
            
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              📊 {completionPercentage}% Complete
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {gameData.userName}'s Parcel
                </h2>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {ownedSquaresCount}/25 squares
                  </div>
                  <button 
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 flex items-center space-x-1"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Refresh</span>
                  </button>
                </div>
              </div>
              
              {/* 5x5 Grid */}
              <div className="grid grid-cols-5 gap-2 bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
                {Array.from({ length: 25 }, (_, index) => {
                  const x = index % 5;
                  const y = Math.floor(index / 5);
                  const ownedSquare = gameData.ownedSquares.find(sq => sq.x === x && sq.y === y);
                  
                  return (
                    <LandSquare
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      isOwned={!!ownedSquare}
                      type={ownedSquare?.type}
                      onClick={handleSquareClick}
                      isHighlighted={selectedSquare?.x === x && selectedSquare?.y === y}
                    />
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-6 space-y-4">
                <ProgressBar 
                  current={ownedSquaresCount} 
                  total={25} 
                  label="Progress to Full Parcel"
                  color="green"
                />
                
                {ownedSquaresCount > 0 && ownedSquaresCount < 25 && (
                  <div className="text-center text-sm text-gray-600">
                    {gameData.userName}, you need {25 - ownedSquaresCount} more squares to complete your land! 🚀
                  </div>
                )}
                
                {ownedSquaresCount === 25 && (
                  <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-2xl mb-1">🎉</div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {gameData.userName} completed their land parcel!
                    </p>
                    <p className="text-xs text-yellow-700">All 25 squares claimed!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Player Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Player</span>
                  <span className="font-semibold">{gameData.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Personal Land</span>
                  <span className="font-semibold text-green-600">{ownedSquaresCount} squares</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-semibold text-blue-600">{completionPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Streak</span>
                  <div className="flex items-center text-orange-500">
                    <Zap className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{gameData.streakDays} days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Earnings</span>
                  <div className="flex items-center text-yellow-600">
                    <Trophy className="w-4 h-4 mr-1" />
                    <span className="font-semibold">${gameData.totalEarnings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Rewards */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Gift className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Available Rewards</h3>
              </div>
              
              {gameData.availableRewards.filter(r => r.count > 0).length > 0 ? (
                <div className="grid gap-4">
                  {gameData.availableRewards
                    .filter(reward => reward.count > 0)
                    .map((reward, index) => (
                      <RewardCard
                        key={index}
                        type={reward.type}
                        count={reward.count}
                        onClaim={handleClaimReward}
                        isLoading={claimingReward === reward.type}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rewards available for {gameData.userName}</p>
                  <p className="text-sm">Contact your manager to earn more land rewards!</p>
                  {isUsingMockData && (
                    <button 
                      onClick={() => mockService.giveRewardToUser(currentUserId, 'forest', 2)}
                      className="mt-3 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded"
                    >
                      Add Demo Rewards
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Achievement Progress */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Next Milestone</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className="text-sm text-gray-600 mb-2">Personal Land Empire</p>
                  <p className="text-xs text-gray-500">Complete your own 25 squares to unlock exclusive rewards</p>
                </div>
                <ProgressBar 
                  current={ownedSquaresCount} 
                  total={25} 
                  label="Completion Progress"
                  color="purple"
                />
                
                {ownedSquaresCount === 25 && (
                  <div className="text-center bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-2xl mb-1">👑</div>
                    <p className="text-sm font-semibold text-green-800">Land Empire Complete!</p>
                    <p className="text-xs text-green-700">{gameData.userName} owns their full Parcel!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel (only in demo mode) */}
        {isUsingMockData && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-orange-800 mb-2">🧪 Demo Mode</h3>
            <p className="text-sm text-orange-700 mb-3">
              You're using mock data. Configure Airtable credentials in your .env file to use real data.
            </p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => mockService.giveRewardToUser(currentUserId, 'forest', 1).then(refreshData)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                + Forest Reward
              </button>
              <button 
                onClick={() => mockService.giveRewardToUser(currentUserId, 'house', 1).then(refreshData)}
                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
              >
                + House Reward
              </button>
              <button 
                onClick={() => mockService.giveRewardToUser(currentUserId, 'tree', 1).then(refreshData)}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                + Tree Reward
              </button>
              <button 
                onClick={() => {
                  mockService.resetUserData(currentUserId);
                  refreshData();
                }}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                Reset {gameData?.userName}'s Progress
              </button>
            </div>
          </div>
        )}

        {/* Debug Panel for Airtable testing */}
        {!isUsingMockData && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-blue-800 mb-2">🔧 Airtable Debug</h3>
            <p className="text-sm text-blue-700 mb-3">
              Test your Airtable connection and rewards.
            </p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={async () => {
                  console.log('🧪 Testing rewards table...');
                  try {
                    await dataService.debugRewardsTable();
                  } catch (error) {
                    console.error('Debug failed:', error);
                  }
                }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                Debug Rewards Table
              </button>
              <button 
                onClick={async () => {
                  console.log('🧪 Testing direct rewards...');
                  try {
                    const result = await dataService.testGetRewardsDirectly(currentUserId);
                    console.log('🎯 Direct test result:', result);
                    alert(`Found ${result.length} rewards directly!`);
                  } catch (error) {
                    console.error('Direct test failed:', error);
                  }
                }}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
              >
                Test Direct Rewards
              </button>
              <button 
                onClick={refreshData}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                Force Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}