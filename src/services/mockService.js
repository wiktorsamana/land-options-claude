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
        { x: 1, y: 1, type: 'jungle plot', earnedDate: '2025-01-15' },
        { x: 2, y: 1, type: 'flathouse', earnedDate: '2025-01-20' },
        { x: 0, y: 2, type: 'jungle plot', earnedDate: '2025-01-22' },
        { x: 1, y: 2, type: 'jungle plot', earnedDate: '2025-02-01' },
        { x: 3, y: 3, type: 'flathouse', earnedDate: '2025-02-05' },
        { x: 4, y: 4, type: 'jungle plot', earnedDate: '2025-02-10' },
      ]
    };

    this.rewards = {
      'employee_001': [
        { type: 'jungle plot', count: 2 },
        { type: 'flathouse', count: 1 },
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

  async getUserByEmail(email) {
    await this.delay(300);
    
    // Find user by email
    const user = Object.values(this.users).find(u => u.email === email);
    if (!user) {
      return null;
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

  // Pending Payments Management (Mock)
  async getUserPendingPayments(userId) {
    await this.delay(300);
    
    // Initialize converted payments tracking if not exists
    if (!this.convertedPayments) {
      this.convertedPayments = new Set();
    }
    
    // Return mock pending payments
    const mockPayments = [
      {
        id: 'pay_001',
        userId: userId,
        amount: 1000,
        description: 'Q4 Performance Bonus',
        paymentDate: '2024-01-15',
        status: this.convertedPayments.has('pay_001') ? 'converted' : 'pending',
        type: 'bonus'
      },
      {
        id: 'pay_002',
        userId: userId,
        amount: 2500,
        description: 'Project Completion Bonus',
        paymentDate: '2024-01-10',
        status: this.convertedPayments.has('pay_002') ? 'converted' : 'pending',
        type: 'bonus'
      },
      {
        id: 'pay_003',
        userId: userId,
        amount: 750,
        description: 'Referral Bonus',
        paymentDate: '2024-01-05',
        status: this.convertedPayments.has('pay_003') ? 'converted' : 'pending',
        type: 'referral'
      }
    ];
    
    // Filter to only show pending payments (not converted)
    return mockPayments.filter(p => p.status !== 'converted');
  }

  async convertPaymentToLand(paymentId, userId, landType, squaresEarned) {
    await this.delay(600);
    
    console.log('🔄 [MOCK] Converting payment to land:', { paymentId, userId, landType, squaresEarned });
    
    // Add the land rewards
    await this.addReward(userId, landType, squaresEarned);
    
    // Track converted payment
    if (!this.convertedPayments) {
      this.convertedPayments = new Set();
    }
    this.convertedPayments.add(paymentId);
    
    console.log('✅ [MOCK] Payment converted successfully');
    return true;
  }

  // Investor conversion methods
  async convertInvestmentToLand(userId, landType, investmentAmount, squaresEarned) {
    await this.delay(600);
    
    console.log('🔄 [MOCK] Converting investment to land:', { userId, landType, investmentAmount, squaresEarned });
    
    // Add the land rewards
    await this.addReward(userId, landType, squaresEarned);
    
    // Track the investment conversion (could be stored in a separate table in real implementation)
    if (!this.investmentConversions) {
      this.investmentConversions = [];
    }
    
    this.investmentConversions.push({
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      landType,
      investmentAmount,
      squaresEarned,
      convertedDate: new Date().toISOString(),
      status: 'completed'
    });
    
    console.log('✅ [MOCK] Investment converted successfully');
    return true;
  }

  async getUserInvestmentHistory(userId) {
    await this.delay(300);
    
    if (!this.investmentConversions) {
      return [];
    }
    
    return this.investmentConversions.filter(inv => inv.userId === userId);
  }
}

export default new MockService();