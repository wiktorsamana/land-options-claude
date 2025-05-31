// airtableService.js
import Airtable from 'airtable';

// Configuration - Add these to your environment variables
// const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
// const AIRTABLE_ACCESS_TOKEN = process.env.REACT_APP_AIRTABLE_ACCESS_TOKEN;

const AIRTABLE_BASE_ID = 'app9LT4HqQCEGSY9x';
const AIRTABLE_ACCESS_TOKEN = 'patEyTO1W1n2W7JpB.13d902acf623ba2bd8948ccfcd1d9231810cc0011242a002a2f1b4dad49ec8a3';

// Debug in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Airtable Service Debug:');
  console.log('Base ID present:', !!AIRTABLE_BASE_ID);
  console.log('Access Token present:', !!AIRTABLE_ACCESS_TOKEN);
  if (AIRTABLE_BASE_ID) {
    console.log('Base ID format check:', AIRTABLE_BASE_ID.startsWith('app') ? '✅' : '❌ Should start with "app"');
  }
  if (AIRTABLE_ACCESS_TOKEN) {
    console.log('Token format check:', AIRTABLE_ACCESS_TOKEN.startsWith('pat') ? '✅' : '❌ Should start with "pat"');
  }
}

// Check if environment variables are set
if (!AIRTABLE_BASE_ID || !AIRTABLE_ACCESS_TOKEN) {
  console.warn('⚠️ Airtable credentials not found. Using mock service.');
  console.warn('Expected environment variables:');
  console.warn('- REACT_APP_AIRTABLE_BASE_ID (starts with "app")');
  console.warn('- REACT_APP_AIRTABLE_ACCESS_TOKEN (starts with "pat")');
}

// Initialize Airtable
const base = AIRTABLE_BASE_ID && AIRTABLE_ACCESS_TOKEN ? 
  new Airtable({
    apiKey: AIRTABLE_ACCESS_TOKEN
  }).base(AIRTABLE_BASE_ID) : null;

class AirtableService {
  constructor() {
    if (base) {
      this.usersTable = base('Users');
      this.landSquaresTable = base('Land Squares');
      this.rewardsTable = base('Rewards');
      this.isConnected = true;
    } else {
      this.isConnected = false;
      console.log('Airtable not configured - using mock data');
    }
  }

  // Get all users for user selector
  async getAllUsers() {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const records = await this.usersTable.select({
        sort: [{ field: 'name', direction: 'asc' }]
      }).all();
      
      return records.map(record => ({
        id: record.id,
        userId: record.fields.user_id,
        name: record.fields.name,
        email: record.fields.email,
        streakDays: record.fields.streak_days || 0,
        totalEarnings: record.fields.total_earnings || 0
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }
  async getUser(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const records = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (records.length === 0) {
        throw new Error('User not found');
      }
      
      return {
        id: records[0].id,
        userId: records[0].fields.user_id,
        name: records[0].fields.name,
        email: records[0].fields.email,
        streakDays: records[0].fields.streak_days || 0,
        totalEarnings: records[0].fields.total_earnings || 0
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(userData) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const record = await this.usersTable.create({
        user_id: userData.userId,
        name: userData.name,
        email: userData.email,
        streak_days: 0,
        total_earnings: 0
      });
      
      return {
        id: record.id,
        userId: record.fields.user_id,
        name: record.fields.name,
        email: record.fields.email,
        streakDays: record.fields.streak_days,
        totalEarnings: record.fields.total_earnings
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Land Squares Management
  async getUserLandSquares(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const records = await this.landSquaresTable.select({
        filterByFormula: `AND({user_id} = '${userId}', {is_active} = TRUE())`,
        sort: [{ field: 'earned_date', direction: 'desc' }]
      }).all();
      
      return records.map(record => ({
        id: record.id,
        x: record.fields.x_coordinate,
        y: record.fields.y_coordinate,
        type: record.fields.land_type?.toLowerCase() || 'forest',
        earnedDate: record.fields.earned_date
      }));
    } catch (error) {
      console.error('Error fetching land squares:', error);
      throw error;
    }
  }

  async claimLandSquare(userId, x, y, landType) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const squareId = `${userId}_${x}_${y}`;
      
      // First get the user's Airtable record ID
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        throw new Error('User not found');
      }
      
      const userRecordId = userRecords[0].id;
      
      const record = await this.landSquaresTable.create({
        square_id: squareId,
        user_id: [userRecordId], // Link to user record
        x_coordinate: x,
        y_coordinate: y,
        land_type: landType.charAt(0).toUpperCase() + landType.slice(1),
        earned_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
      
      return {
        id: record.id,
        x: record.fields.x_coordinate,
        y: record.fields.y_coordinate,
        type: record.fields.land_type.toLowerCase(),
        earnedDate: record.fields.earned_date
      };
    } catch (error) {
      console.error('Error claiming land square:', error);
      throw error;
    }
  }

  // Rewards Management
  async getUserRewards(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      // First get the user's Airtable record ID
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        return [];
      }
      
      const userRecordId = userRecords[0].id;
      
      console.log('🔍 getUserRewards Debug:');
      console.log('userRecordId:', userRecordId);
      
      const records = await this.rewardsTable.select({
        filterByFormula: `SEARCH('${userRecordId}', ARRAYJOIN({user_id})) > 0`
      }).all();
      
      console.log('Found reward records in getUserRewards:', records.length);
      if (records.length > 0) {
        console.log('First record fields:', records[0].fields);
      }
      
      return records.map(record => ({
        id: record.id,
        type: record.fields.land_type?.toLowerCase() || 'forest',
        count: record.fields.count || 0
      }));
    } catch (error) {
      console.error('Error fetching rewards:', error);
      throw error;
    }
  }

  async updateRewardCount(userId, landType, newCount) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      // First get the user's Airtable record ID
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        throw new Error('User not found');
      }
      
      const userRecordId = userRecords[0].id;
      
      // Find existing reward record
      const capitalizedLandType = landType.charAt(0).toUpperCase() + landType.slice(1);
      const filterFormula = `AND(SEARCH('${userRecordId}', ARRAYJOIN({user_id})) > 0, {land_type} = '${capitalizedLandType}')`;
      
      console.log('🔍 updateRewardCount Debug:');
      console.log('userId:', userId);
      console.log('userRecordId:', userRecordId);
      console.log('landType:', landType);
      console.log('capitalizedLandType:', capitalizedLandType);
      console.log('filterFormula:', filterFormula);
      
      const rewardRecords = await this.rewardsTable.select({
        filterByFormula: filterFormula
      }).all();
      
      console.log('Found reward records:', rewardRecords.length);
      if (rewardRecords.length > 0) {
        console.log('First record fields:', rewardRecords[0].fields);
      }
      
      if (rewardRecords.length > 0) {
        // Update existing record
        const record = await this.rewardsTable.update(rewardRecords[0].id, {
          count: newCount
        });
        
        return {
          id: record.id,
          type: record.fields.land_type.toLowerCase(),
          count: record.fields.count
        };
      } else {
        // Create new record
        const record = await this.rewardsTable.create({
          user_id: [userRecordId],
          land_type: landType.charAt(0).toUpperCase() + landType.slice(1),
          count: newCount
        });
        
        return {
          id: record.id,
          type: record.fields.land_type.toLowerCase(),
          count: record.fields.count
        };
      }
    } catch (error) {
      console.error('Error updating reward count:', error);
      throw error;
    }
  }

  async addReward(userId, landType, count = 1) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const currentRewards = await this.getUserRewards(userId);
      const existingReward = currentRewards.find(r => r.type === landType);
      const newCount = existingReward ? existingReward.count + count : count;
      
      return await this.updateRewardCount(userId, landType, newCount);
    } catch (error) {
      console.error('Error adding reward:', error);
      throw error;
    }
  }

  // Game Data Management
  async getGameData(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      const [user, landSquares, rewards] = await Promise.all([
        this.getUser(userId),
        this.getUserLandSquares(userId),
        this.getUserRewards(userId)
      ]);
      
      return {
        userId: user.userId,
        userName: user.name,
        totalLandParcels: Math.floor(landSquares.length / 25), // Complete parcels
        ownedSquares: landSquares,
        availableRewards: rewards,
        nextParcelProgress: landSquares.length,
        streakDays: user.streakDays,
        totalEarnings: user.totalEarnings
      };
    } catch (error) {
      console.error('Error fetching game data:', error);
      throw error;
    }
  }

  // Check connection status
  isAirtableConnected() {
    return this.isConnected;
  }
}

export default new AirtableService();