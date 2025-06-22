import React, { useState, useEffect } from 'react';
import { Trophy, MapPin, Gift, Zap, Target, Loader, RefreshCw, Users, Settings, Building2, ChevronLeft, ChevronRight, Lock, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import './LandGameApp.css';

// Import services
import airtableService from '../services/airtableService';
// import airtableServiceLegacy from '../services/airtableServiceLegacy'; // Uncomment if using legacy
import mockService from '../services/mockService';

// Components
import LandSquare from './LandSquare';
import ProgressBar from './ProgressBar';
import RewardCard from './RewardCard';
import UserSelector from './UserSelector';
import EconomicsGuide from './EconomicsGuide';

// Debug credentials in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Check:');
  console.log('Base ID:', process.env.REACT_APP_AIRTABLE_BASE_ID ? '✅ Found' : '❌ Missing');
  console.log('Access Token:', process.env.REACT_APP_AIRTABLE_ACCESS_TOKEN ? '✅ Found' : '❌ Missing');
}

export default function LandGameApp() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('userId');
  const emailFromUrl = urlParams.get('email');
  const hideControls = urlParams.get('hideControls') === 'true';
  
  const [gameData, setGameData] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  const [claimMode, setClaimMode] = useState(null); // Stores the reward type being claimed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showEconomicsGuide, setShowEconomicsGuide] = useState(false);

  // Choose service based on Airtable configuration
  const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;
  const isUsingMockData = !airtableService.isAirtableConnected();

  // Initialize user from URL parameters
  useEffect(() => {
    const initializeUser = async () => {
      if (emailFromUrl) {
        // Try to find user by email
        try {
          const user = await dataService.getUserByEmail(emailFromUrl);
          if (user) {
            setCurrentUserId(user.userId);
          } else {
            setError(`User with email ${emailFromUrl} not found`);
            setCurrentUserId("employee_001"); // Fallback
          }
        } catch (err) {
          console.error('Error finding user by email:', err);
          setCurrentUserId("employee_001"); // Fallback
        }
      } else if (userIdFromUrl) {
        setCurrentUserId(userIdFromUrl);
      } else {
        setCurrentUserId("employee_001"); // Default
      }
      setInitialLoadComplete(true);
    };

    initializeUser();
  }, [emailFromUrl, userIdFromUrl]); // Only run once on mount

  // Load game data when user is set
  useEffect(() => {
    if (currentUserId && initialLoadComplete) {
      loadGameData();
    }
  }, [currentUserId, initialLoadComplete]); // Reload when user changes

  // Check if guide should be shown on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenEconomicsGuide');
    if (!hasSeenGuide && gameData) {
      setShowEconomicsGuide(true);
    }
  }, [gameData]);
  
  // Update URL when user changes
  useEffect(() => {
    if (currentUserId && gameData) {
      const newUrl = new URL(window.location);
      // Clear both parameters first
      newUrl.searchParams.delete('userId');
      newUrl.searchParams.delete('email');
      // Set email parameter (preferred over userId)
      if (gameData.currentUser && gameData.currentUser.email) {
        newUrl.searchParams.set('email', gameData.currentUser.email);
      } else {
        newUrl.searchParams.set('userId', currentUserId);
      }
      window.history.pushState({}, '', newUrl);
    }
  }, [currentUserId, gameData]);

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
    // If in claim mode and square is available, claim it
    if (claimMode) {
      const isOwned = gameData.ownedSquares.some(sq => sq.x === x && sq.y === y);
      if (!isOwned) {
        handleClaimToSquare(x, y, claimMode);
      }
      return;
    }
    
    // Normal selection behavior
    setSelectedSquare({ x, y });
  };

  const handleClaimReward = async (rewardType) => {
    if (!gameData || claimingReward) return;
    
    const reward = gameData.availableRewards.find(r => r.type === rewardType);
    if (!reward || reward.count <= 0) return;
    
    // Only claim whole units
    const wholeUnits = Math.floor(reward.count);
    if (wholeUnits <= 0) return;

    // Check if there are available squares
    const availableSquares = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const isOwned = gameData.ownedSquares.some(sq => sq.x === x && sq.y === y);
        if (!isOwned) availableSquares.push({ x, y });
      }
    }

    if (availableSquares.length === 0) {
      alert('No available squares left! You\'ve completed your land parcel! 🎉');
      return;
    }

    // Enter claim mode
    setClaimMode(rewardType);
    setSelectedSquare(null); // Clear any existing selection
  };

  const handleClaimToSquare = async (x, y, rewardType) => {
    if (!gameData || claimingReward) return;
    
    const reward = gameData.availableRewards.find(r => r.type === rewardType);
    if (!reward || reward.count <= 0) return;

    try {
      setClaimingReward(rewardType);

      // Claim the land square
      const newSquare = await dataService.claimLandSquare(
        currentUserId, 
        x, 
        y, 
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

      // Show fireworks celebration
      triggerFireworks();
      
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
      setClaimMode(null); // Exit claim mode
    }
  };

  const cancelClaimMode = () => {
    setClaimMode(null);
    setSelectedSquare(null);
  };

  const triggerFireworks = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Left side fireworks
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.8) }
      });
      
      // Right side fireworks
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.8) }
      });
    }, 250);
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

  const handleGuideComplete = () => {
    localStorage.setItem('hasSeenEconomicsGuide', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
          <div className="text-center mb-8">
          {/* User Selector and Admin Button */}
          {!hideControls && (
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
              
              {/* Investor Converter Link */}
              <a
                href={`/investor-converter?userId=${currentUserId}`}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md"
                title="Investor Land Conversion Portal"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Investor Portal</span>
              </a>
            </div>
          )}
          {!hideControls && (
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
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Header section, user, progress, refresh button, etc. */}
              {/* <div className="flex items-center justify-between mb-6">
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
              </div> */}
              
              {/* Claim Mode Instructions */}
              {claimMode && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                        🎯 Select a square to claim your {claimMode}
                      </h3>
                      <p className="text-xs text-yellow-700">
                        Click on any available (glowing) square to place your land reward
                      </p>
                    </div>
                    <button
                      onClick={cancelClaimMode}
                      className="px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* 5x5 Grid */}
              <div className="land-map-container p-6 rounded-lg relative overflow-hidden shadow-xl">
                {/* Removed overlay to show plain image */}
                
                {/* Grid frame with plot label */}
                <div className="relative z-10 max-w-md mx-auto">
                  {/* Plot boundary frame */}
                  <div className="absolute inset-0 border-3 border-dashed border-green-600/30 rounded-lg pointer-events-none">
                    {/* 300 sqm label */}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-sm font-bold text-green-800 bg-gray-100/40 border border-green-600/30 rounded shadow-sm backdrop-blur-sm">
                      300 sqm
                    </div>
                  </div>
                  
                  {/* Grid container */}
                  <div className="p-4 grid grid-cols-5 gap-2">
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
                        earnedDate={ownedSquare?.earnedDate}
                        onClick={handleSquareClick}
                        isHighlighted={selectedSquare?.x === x && selectedSquare?.y === y}
                        claimMode={claimMode}
                        isClaimable={claimMode && !ownedSquare}
                      />
                    );
                  })}
                  </div>
                </div>
              </div>
              
              {/* Land Equivalency Info */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Real Land Equivalent
                  <button
                    onClick={() => setShowEconomicsGuide(true)}
                    className="ml-2 text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1"
                    title="Learn about Land Options Economics"
                  >
                    <Info className="w-3 h-3" />
                    <span>Guide</span>
                  </button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="font-semibold text-gray-700 mb-1">Full Parcel</p>
                    <p className="text-gray-600">25 squares = 300m² plot in NC3</p>
                    <p className="text-yellow-600 font-semibold mt-1">
                      Market value: ${gameData.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="font-semibold text-gray-700 mb-1">Your Progress</p>
                    <p className="text-gray-600">
                      {ownedSquaresCount} squares = {Math.round((ownedSquaresCount / 25) * 300)}m²
                    </p>
                    <p className="text-green-600 font-semibold">
                      {((ownedSquaresCount / 25) * 100).toFixed(0)}% complete
                    </p>
                    <p className="text-blue-600 font-semibold mt-1">
                      Value: ${Math.round((ownedSquaresCount / 25) * gameData.totalEarnings).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="font-semibold text-gray-700 mb-1">Each Square</p>
                    <p className="text-gray-600">1 square = 12m² of land</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <ProgressBar 
                    current={ownedSquaresCount} 
                    total={25} 
                    label="Progress to Full Parcel"
                    color="green"
                  />
                  
                  {ownedSquaresCount > 0 && ownedSquaresCount < 25 && (
                    <div className="text-center text-sm text-gray-600 mt-2">
                      You need {25 - ownedSquaresCount} more squares to complete your parcel! 🚀
                    </div>
                  )}
                  
                  {ownedSquaresCount === 25 && (
                    <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Convert Bonus Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-3">
                  <Trophy className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">Convert Bonuses</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Transform your employee bonuses and paid invoices into valuable land squares. 
                  Get a 2x multiplier on all conversions!
                </p>
                
                <a
                  href={`/bonus-converter?userId=${currentUserId}`}
                  className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  title="Convert Bonus / Invoices to Land"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Convert Bonus / Invoice</span>
                </a>
                
                <div className="mt-3 text-xs text-gray-500 text-center">
                  💡 Tip: $1000 bonus = 2000$ land value = 1 square
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
                      onClick={() => mockService.giveRewardToUser(currentUserId, 'jungle plot', 2)}
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
              
              {/* Milestone Carousel */}
              <div className="relative">
                {/* Navigation Buttons */}
                <button
                  onClick={() => setCurrentMilestoneIndex(Math.max(0, currentMilestoneIndex - 1))}
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md hover:shadow-lg transition-all ${
                    currentMilestoneIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={currentMilestoneIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                
                <button
                  onClick={() => setCurrentMilestoneIndex(Math.min(2, currentMilestoneIndex + 1))}
                  className={`absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md hover:shadow-lg transition-all ${
                    currentMilestoneIndex === 2 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={currentMilestoneIndex === 2}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Milestone Content */}
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentMilestoneIndex * 100}%)` }}
                  >
                    {/* Milestone 1: Personal Parcel */}
                    <div className="w-full flex-shrink-0 px-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🏆</div>
                          <div className="flex items-center justify-center mb-2">
                            <p className="text-sm font-semibold text-gray-700">Personal Parcel in NC3</p>
                          </div>
                          {/* Slider dots positioned with milestone title */}
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            {[0, 1, 2].map((index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentMilestoneIndex(index)}
                                className={`transition-all rounded-full ${
                                  index === currentMilestoneIndex
                                    ? 'bg-purple-600 w-8 h-3'
                                    : 'bg-gray-300 w-3 h-3 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to milestone ${index + 1}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Complete your own 25 squares to secure your NC3 plot!</p>
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
                            <p className="text-sm font-semibold text-green-800">Milestone Complete!</p>
                            <p className="text-xs text-green-700">You own a full NC3 Parcel!</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Milestone 2: Flathouse Mini */}
                    <div className="w-full flex-shrink-0 px-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl mb-2 relative">
                            {ownedSquaresCount < 25 ? (
                              <>
                                <Lock className="w-8 h-8 text-gray-400 mx-auto" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-5xl opacity-20">🏠</div>
                                </div>
                              </>
                            ) : (
                              '🏠'
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Flathouse Mini</p>
                          {/* Slider dots positioned with milestone title */}
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            {[0, 1, 2].map((index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentMilestoneIndex(index)}
                                className={`transition-all rounded-full ${
                                  index === currentMilestoneIndex
                                    ? 'bg-purple-600 w-8 h-3'
                                    : 'bg-gray-300 w-3 h-3 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to milestone ${index + 1}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Compact residential unit investment</p>
                        </div>
                        
                        {ownedSquaresCount < 25 ? (
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Unlock First Milestone</p>
                            <p className="text-xs text-gray-500 mt-1">Complete your Personal Parcel to see progress</p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-600 font-medium">Coming Soon</p>
                            <p className="text-xs text-blue-500 mt-1">Progress tracking will be available</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Milestone 3: Flathouse */}
                    <div className="w-full flex-shrink-0 px-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl mb-2 relative">
                            {ownedSquaresCount < 25 ? (
                              <>
                                <Lock className="w-8 h-8 text-gray-400 mx-auto" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-5xl opacity-20">🏢</div>
                                </div>
                              </>
                            ) : (
                              '🏢'
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Flathouse</p>
                          {/* Slider dots positioned with milestone title */}
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            {[0, 1, 2].map((index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentMilestoneIndex(index)}
                                className={`transition-all rounded-full ${
                                  index === currentMilestoneIndex
                                    ? 'bg-purple-600 w-8 h-3'
                                    : 'bg-gray-300 w-3 h-3 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to milestone ${index + 1}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Premium residential building investment</p>
                        </div>
                        
                        {ownedSquaresCount < 25 ? (
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Unlock First Milestone</p>
                            <p className="text-xs text-gray-500 mt-1">Complete your Personal Parcel to see progress</p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-600 font-medium">Coming Soon</p>
                            <p className="text-xs text-blue-500 mt-1">Progress tracking will be available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                onClick={() => mockService.giveRewardToUser(currentUserId, 'jungle plot', 1).then(refreshData)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                + Forest Reward
              </button>
              <button 
                onClick={() => mockService.giveRewardToUser(currentUserId, 'flathouse', 1).then(refreshData)}
                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
              >
                + House Reward
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
        {/* {!isUsingMockData && (
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
        )} */}
      </div>
      
      {/* Economics Guide Modal */}
      {showEconomicsGuide && (
        <EconomicsGuide 
          onClose={() => setShowEconomicsGuide(false)}
          onComplete={handleGuideComplete}
        />
      )}
    </div>
  );
}