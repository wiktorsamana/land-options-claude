import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Building2, DollarSign } from 'lucide-react';
import InvestorConverter from './InvestorConverter';

const InvestorConverterPage = ({ dataService, onNavigateBack }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await dataService.getAllUsers();
      setUsers(allUsers);
      
      // Auto-select first user if available
      if (allUsers.length > 0) {
        setSelectedUserId(allUsers[0].userId);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestmentConverted = (conversionSummary) => {
    console.log('Investment converted:', conversionSummary);
    // You could show a success message, reload data, etc.
  };

  const selectedUser = users.find(user => user.userId === selectedUserId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading investor portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Portal</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onNavigateBack}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Investor Land Conversion Portal</h1>
                  <p className="text-sm text-gray-600">Convert your investment to premium land assets</p>
                </div>
              </div>
            </div>
            
            {/* User Selector */}
            {users.length > 0 && (
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Investor</option>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Premium Land Investment Portal</h2>
              <p className="text-blue-100 text-lg">
                Convert your investment into high-value land assets with exclusive multipliers
              </p>
              {selectedUser && (
                <p className="text-blue-200 mt-2">
                  Welcome, <span className="font-semibold">{selectedUser.name}</span>
                </p>
              )}
            </div>
            <div className="hidden md:block">
              <TrendingUp className="w-16 h-16 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Investment Options Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🌴</span>
              <div>
                <h3 className="font-bold text-gray-800">Jungle Plot</h3>
                <p className="text-sm text-gray-600">2x Multiplier</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Multiplier:</span> 2.0x</p>
              <p><span className="font-medium">Cost per Unit:</span> $1,000</p>
              <p><span className="font-medium">Minimum:</span> 25 units ($25,000)</p>
              <p><span className="font-medium">Land Size:</span> 25 units = 300m²</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🏢</span>
              <div>
                <h3 className="font-bold text-gray-800">Flathouse</h3>
                <p className="text-sm text-gray-600">Premium Unit</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Price per Unit:</span> $150,000</p>
              <p><span className="font-medium">Multiplier:</span> 1x</p>
              <p><span className="font-medium">Minimum:</span> 1 unit ($150,000)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🏠</span>
              <div>
                <h3 className="font-bold text-gray-800">Flathouse Mini</h3>
                <p className="text-sm text-gray-600">Compact Unit</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Price per Unit:</span> $100,000</p>
              <p><span className="font-medium">Multiplier:</span> 1x</p>
              <p><span className="font-medium">Minimum:</span> 1 unit ($100,000)</p>
            </div>
          </div>
        </div>

        {/* Main Converter */}
        {selectedUserId ? (
          <InvestorConverter
            userId={selectedUserId}
            dataService={dataService}
            onInvestmentConverted={handleInvestmentConverted}
          />
        ) : (
          <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select an Investor</h3>
            <p className="text-gray-600">
              Please select an investor from the dropdown above to begin the conversion process.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Investment Process:</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                  Enter your total investment amount
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                  Allocate funds across different land types
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                  Review conversion summary and terms
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                  Confirm final conversion
                </li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Benefits:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Exclusive multipliers for higher returns
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Flexible allocation across asset types
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Immediate conversion and tracking
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Premium land asset ownership
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorConverterPage;