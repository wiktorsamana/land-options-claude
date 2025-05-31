// mockService.js
// This service simulates Airtable for development/testing

class MockService {
  constructor() {
    // Initialize with sample data
    this.users = {
      'employee_001': {
        userId: 'employee_001',
        name: 'Alex Johnson',
        email: 'alex@company.com',
        streakDays: 12,
        totalEarnings: 847
      },
      'employee_002': {
        userId: 'employee_002',
        name: 'Sarah Davis',
        email: 'sarah@company.com',
        streakDays: 8,
        totalEarnings: 1234
      }
    };

    this.landSquares = {
      'employee_001': [
        { x: 1, y: 1, type: 'forest', earnedDate: '2025-01-15' },
        { x: 2, y: 1, type: 'house', earnedDate: '2025-01-20' },
        { x: 0, y: 2, type: 'forest', earnedDate: '2025-01-22' },
        { x: 1, y: 2, type: 'tree', earnedDate: '2025-02-01' },
        { x: 3, y: 3, type: 'house', earnedDate: '2025-02-05' },
        { x: 4, y: 4, type: 'forest', earnedDate: '2025-02-10' },
      ]
    };

    this.rewards = {
      'employee_001': [
        { type: 'forest', count: 2 },
        { type: 'house', count: 1 },
        { type: 'tree', count: 1 }
      ]
    };
  }

  async getAllUsers() {
    await this.delay(300);
    
    return Object.values(this.users);
  }
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getUser(userId) {
    await this.delay(300);
    
    const user = this.users[userId];
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async createUser(userData) {
    await this.delay(500);
    
    this.users[userData.userId] = {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      streakDays: 0,
      totalEarnings: 0
    };

    // Initialize empty arrays for new user
    this.landSquares[userData.userId] = [];
    this.rewards[userData.userId] = [];
    
    return this.users[userData.userId];
  }

  async getUserLandSquares(userId) {
    await this.delay(400);
    
    return this.landSquares[userId] || [];
  }

  async claimLandSquare(userId, x, y, landType) {
    await this.delay(600);
    
    const newSquare = {
      x,
      y,
      type: landType,
      earnedDate: new Date().toISOString().split('T')[0]
    };
    
    if (!this.landSquares[userId]) {
      this.landSquares[userId] = [];
    }
    
    this.landSquares[userId].push(newSquare);
    return newSquare;
  }

  async getUserRewards(userId) {
    await this.delay(300);
    
    return this.rewards[userId] || [];
  }

  async updateRewardCount(userId, landType, newCount) {
    await this.delay(400);
    
    if (!this.rewards[userId]) {
      this.rewards[userId] = [];
    }
    
    const existingReward = this.rewards[userId].find(r => r.type === landType);
    
    if (existingReward) {
      existingReward.count = newCount;
      return existingReward;
    } else {
      const newReward = { type: landType, count: newCount };
      this.rewards[userId].push(newReward);
      return newReward;
    }
  }

  async addReward(userId, landType, count = 1) {
    await this.delay(400);
    
    const currentRewards = await this.getUserRewards(userId);
    const existingReward = currentRewards.find(r => r.type === landType);
    const newCount = existingReward ? existingReward.count + count : count;
    
    return await this.updateRewardCount(userId, landType, newCount);
  }

  async getGameData(userId) {
    await this.delay(800);
    
    const [user, landSquares, rewards] = await Promise.all([
      this.getUser(userId),
      this.getUserLandSquares(userId),
      this.getUserRewards(userId)
    ]);
    
    return {
      userId: user.userId,
      userName: user.name,
      totalLandParcels: Math.floor(landSquares.length / 25),
      ownedSquares: landSquares,
      availableRewards: rewards,
      nextParcelProgress: landSquares.length,
      streakDays: user.streakDays,
      totalEarnings: user.totalEarnings
    };
  }

  // Admin functions for testing
  async giveRewardToUser(userId, landType, count) {
    return await this.addReward(userId, landType, count);
  }

  // Always returns true for mock service
  isAirtableConnected() {
    return false; // Indicates this is mock data
  }

  // Debug functions
  getAllData() {
    return {
      users: this.users,
      landSquares: this.landSquares,
      rewards: this.rewards
    };
  }

  resetUserData(userId) {
    this.landSquares[userId] = [];
    this.rewards[userId] = [];
    return true;
  }
}

export default new MockService();