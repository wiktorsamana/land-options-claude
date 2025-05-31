import React, { useState, useEffect } from 'react';
import { User, ChevronDown } from 'lucide-react';

const UserSelector = ({ currentUserId, onUserChange, dataService }) => {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample users for mock service
  const mockUsers = [
    { userId: 'employee_001', name: 'Alex Johnson', email: 'alex.johnson@company.com' },
    { userId: 'employee_002', name: 'Sarah Davis', email: 'sarah.davis@company.com' },
    { userId: 'employee_003', name: 'Mike Chen', email: 'mike.chen@company.com' },
    { userId: 'employee_004', name: 'Emma Wilson', email: 'emma.wilson@company.com' },
    { userId: 'employee_005', name: 'David Rodriguez', email: 'david.rodriguez@company.com' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (dataService.isAirtableConnected && dataService.isAirtableConnected()) {
        // Load users from Airtable
        const allUsers = await dataService.getAllUsers();
        setUsers(allUsers);
      } else {
        // Use mock users
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to mock users
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = users.find(user => user.userId === currentUserId) || users[0];

  const handleUserSelect = (userId) => {
    onUserChange(userId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-md border">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-lg p-3 shadow-md border hover:shadow-lg transition-shadow w-full min-w-[200px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800">
                {currentUser?.name || 'Select User'}
              </div>
              <div className="text-xs text-gray-500">
                {currentUser?.email || 'No user selected'}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border z-50 max-h-60 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.userId}
              onClick={() => handleUserSelect(user.userId)}
              className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                currentUserId === user.userId ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentUserId === user.userId 
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={`font-medium ${
                    currentUserId === user.userId ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              {currentUserId === user.userId && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSelector;