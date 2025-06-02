// airtableService.js
import Airtable from 'airtable';

// Configuration - Add these to your environment variables
const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
const AIRTABLE_ACCESS_TOKEN = process.env.REACT_APP_AIRTABLE_ACCESS_TOKEN;

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
      this.rewardsTable = base('Available Rewards');
      this.isConnected = true;
      
      // Debug table names
      console.log('🔧 Initialized Airtable tables:');
      console.log('  - Users');
      console.log('  - Land Squares');
      console.log('  - Available Rewards');
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
      console.log('🏞️ FRESH: Fetching land squares for user:', userId, 'at', new Date().toISOString());
      
      // Fresh data fetch
      const records = await this.landSquaresTable.select({
        filterByFormula: `AND({user_id} = '${userId}', {is_active} = TRUE())`,
        sort: [{ field: 'earned_date', direction: 'desc' }]
      }).all();
      
      console.log('✅ FRESH: Found', records.length, 'land squares for', userId);
      
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
      
      // Check if user_id is a linked field or text field
      console.log('🔍 Creating land square with:', {
        userId: userId,
        userRecordId: userRecordId,
        coordinates: `${x},${y}`,
        landType: landType
      });
      
      const record = await this.landSquaresTable.create({
        square_id: squareId,
        user_id: userId, // Use the actual user_id string, not the record ID array
        x_coordinate: x,
        y_coordinate: y,
        land_type: landType,
        earned_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
      
      return {
        id: record.id,
        x: record.fields.x_coordinate,
        y: record.fields.y_coordinate,
        type: record.fields.land_type?.toLowerCase() || 'jungle plot',
        earnedDate: record.fields.earned_date
      };
    } catch (error) {
      console.error('Error claiming land square:', error);
      throw error;
    }
  }

  // Debug function to check what's actually in the rewards table
  async debugRewardsTable() {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🔍 DEBUG: Checking Available Rewards table contents...');
      
      // Get ALL records without any filter
      const allRecords = await this.rewardsTable.select().all();
      console.log('📊 TOTAL RECORDS IN AVAILABLE REWARDS TABLE:', allRecords.length);
      
      if (allRecords.length === 0) {
        console.log('❌ Available Rewards table is EMPTY!');
        console.log('💡 You need to add records to this table.');
        return [];
      }
      
      // Log each record in detail
      allRecords.forEach((record, index) => {
        console.log(`📋 Record ${index + 1}:`);
        console.log('  Record ID:', record.id);
        console.log('  reward_id:', record.fields.reward_id);
        console.log('  user_id:', record.fields.user_id);
        console.log('  land_type:', record.fields.land_type);
        console.log('  count:', record.fields.count);
        console.log('  All fields:', record.fields);
        console.log('  ---');
      });
      
      return allRecords;
    } catch (error) {
      console.error('❌ Debug error:', error);
      throw error;
    }
  }

  // Test method to bypass getUserRewards and directly get rewards
  async testGetRewardsDirectly(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🧪 TEST: Getting rewards directly for:', userId);
      
      // First get the user's record ID
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        console.log('❌ User not found:', userId);
        return [];
      }
      
      const userRecordId = userRecords[0].id;
      console.log('✅ User record ID:', userRecordId);
      
      const allRecords = await this.rewardsTable.select().all();
      console.log('📊 All records found:', allRecords.length);
      
      const matchingRecords = allRecords.filter(record => {
        const userIdField = record.fields.user_id;
        console.log('🔍 Checking record:', record.fields.reward_id);
        console.log('  user_id field:', userIdField);
        console.log('  Looking for record ID:', userRecordId);
        
        // Check against record ID
        let matches = false;
        if (Array.isArray(userIdField)) {
          matches = userIdField.includes(userRecordId);
        } else if (typeof userIdField === 'string') {
          matches = userIdField === userRecordId;
        }
        
        console.log('  Matches:', matches);
        return matches;
      });
      
      console.log('✅ Matching records:', matchingRecords.length);
      
      return matchingRecords.map(record => ({
        id: record.id,
        type: record.fields.land_type?.toLowerCase() || 'forest',
        count: record.fields.count || 0
      }));
    } catch (error) {
      console.error('❌ Test error:', error);
      throw error;
    }
  }

  async debugUserRewardsLinking(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🔍 Debug: Checking user rewards linking for:', userId);
      
      // Get user record
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        console.log('❌ Debug: User not found');
        return;
      }
      
      const userRecord = userRecords[0];
      console.log('✅ Debug: User record found:', {
        id: userRecord.id,
        name: userRecord.fields.name,
        user_id: userRecord.fields.user_id
      });
      
      // Get ALL rewards (to check structure)
      console.log('🔍 Debug: Fetching ALL reward records...');
      const allRewards = await this.rewardsTable.select().all();
      console.log('📊 Debug: Total reward records in table:', allRewards.length);
      
      allRewards.forEach((record, index) => {
        console.log(`   ${index + 1}. Record ID: ${record.id}`);
        console.log(`      user_id field:`, record.fields.user_id);
        console.log(`      user_id type:`, typeof record.fields.user_id);
        console.log(`      land_type:`, record.fields.land_type);
        console.log(`      count:`, record.fields.count);
        console.log('      ---');
      });
      
      // Try different filter approaches
      console.log('🔍 Debug: Trying filter by user record ID...');
      const rewardsByRecordId = await this.rewardsTable.select({
        filterByFormula: `{user_id} = '${userRecord.id}'`
      }).all();
      console.log('📊 Debug: Rewards found by record ID:', rewardsByRecordId.length);
      
      console.log('🔍 Debug: Trying filter by user name...');
      const rewardsByName = await this.rewardsTable.select({
        filterByFormula: `{user_id} = '${userRecord.fields.name}'`
      }).all();
      console.log('📊 Debug: Rewards found by name:', rewardsByName.length);
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }
  async getUserRewards(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🎁 Fetching rewards for user:', userId);
      
      // First get the user's Airtable record ID
      const userRecords = await this.usersTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1
      }).firstPage();
      
      if (userRecords.length === 0) {
        console.log('❌ User not found for rewards:', userId);
        return [];
      }
      
      const userRecordId = userRecords[0].id;
      console.log('✅ Found user record ID:', userRecordId);
      
      // For linked records, we need to search within the array
      // Try multiple approaches to find the records
      console.log('🔍 Attempting to find rewards with multiple filter approaches...');
      
      // Approach 1: Direct match (if it's a text field)
      let records = await this.rewardsTable.select({
        filterByFormula: `{user_id} = '${userRecordId}'`
      }).all();
      console.log('📊 Approach 1 (direct match) found:', records.length);
      
      // Approach 2: Search in array (if it's a linked record)
      if (records.length === 0) {
        records = await this.rewardsTable.select({
          filterByFormula: `SEARCH('${userRecordId}', ARRAYJOIN({user_id})) > 0`
        }).all();
        console.log('📊 Approach 2 (array search) found:', records.length);
      }
      
      // Approach 3: Match by user_id string (not record ID)
      if (records.length === 0) {
        records = await this.rewardsTable.select({
          filterByFormula: `{user_id} = '${userId}'`
        }).all();
        console.log('📊 Approach 3 (user_id string) found:', records.length);
      }
      
      // Approach 4: Get all records and filter manually
      if (records.length === 0) {
        console.log('🔍 Trying manual filtering...');
        const allRecords = await this.rewardsTable.select().all();
        console.log('📊 Total records in table:', allRecords.length);
        
        records = allRecords.filter(record => {
          const userIdField = record.fields.user_id;
          console.log(`Checking record ${record.id}:`, {
            user_id_field: userIdField,
            looking_for: userRecordId,
            user_id_string: userId
          });
          
          // Check various possibilities
          if (Array.isArray(userIdField)) {
            return userIdField.includes(userRecordId) || userIdField.includes(userId);
          }
          return userIdField === userRecordId || userIdField === userId;
        });
        console.log('📊 Manual filter found:', records.length);
      }
      
      console.log('📊 Final reward records found:', records.length);
      records.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.fields.land_type}: ${record.fields.count}`);
        console.log(`      user_id:`, record.fields.user_id);
      });
      
      const rewards = records.map(record => ({
        id: record.id,
        type: record.fields.land_type?.toLowerCase() || 'forest',
        count: record.fields.count || 0
      }));
      
      console.log('✅ Processed rewards:', rewards);
      return rewards;
    } catch (error) {
      console.error('❌ Error fetching rewards:', error);
      throw error;
    }
  }

  async updateRewardCount(userId, landType, newCount) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🔄 Updating reward count:', { userId, landType, newCount });
      
      // First, use getUserRewards to find the existing reward record
      const currentRewards = await this.getUserRewards(userId);
      const existingReward = currentRewards.find(r => r.type === landType.toLowerCase());
      
      if (existingReward) {
        console.log('✅ Found existing reward to update:', existingReward);
        
        // Update the existing record using its ID
        const record = await this.rewardsTable.update(existingReward.id, {
          count: newCount
        });
        
        console.log('✅ Updated reward:', record.fields);
        
        return {
          id: record.id,
          type: record.fields.land_type.toLowerCase(),
          count: record.fields.count
        };
      } else {
        console.log('❌ No existing reward found for', landType, '- NOT creating new one');
        throw new Error(`No reward of type ${landType} found for user ${userId}`);
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
      console.log('🎮 Loading game data for:', userId);
      
      const [user, landSquares, rewards] = await Promise.all([
        this.getUser(userId),
        this.getUserLandSquares(userId),
        this.getUserRewards(userId) // This now uses our comprehensive debugging method
      ]);
      
      console.log('✅ Game data loaded successfully');
      console.log('  User:', user.name);
      console.log('  Land squares:', landSquares.length);
      console.log('  Rewards:', rewards.length);
      
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
    } catch (error) {
      console.error('Error fetching game data:', error);
      throw error;
    }
  }

  // Pending Payments Management
  async getUserPendingPayments(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('💰 Fetching pending payments for user:', userId);
      
      // Assuming you have a "Pending Payments" table in Airtable
      const paymentsTable = base('Pending Payments');
      
      const records = await paymentsTable.select({
        filterByFormula: `AND({user_id} = '${userId}', {status} != 'converted')`,
        sort: [{ field: 'payment_date', direction: 'desc' }]
      }).all();
      
      console.log('📊 Found', records.length, 'pending payments');
      
      return records.map(record => ({
        id: record.id,
        userId: record.fields.user_id,
        amount: record.fields.amount || 0,
        description: record.fields.description || 'Bonus Payment',
        paymentDate: record.fields.payment_date,
        status: record.fields.status || 'pending',
        type: record.fields.type || 'bonus'
      }));
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      // Return empty array if table doesn't exist
      return [];
    }
  }

  async convertPaymentToLand(paymentId, userId, landType, squaresEarned) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🔄 Converting payment to land:', { paymentId, userId, landType, squaresEarned });
      
      // Update the payment status to 'converted'
      const paymentsTable = base('Pending Payments');
      await paymentsTable.update(paymentId, {
        status: 'converted',
        converted_date: new Date().toISOString(),
        converted_to_squares: squaresEarned,
        converted_land_type: landType
      });
      
      // Add the land rewards
      await this.addReward(userId, landType, squaresEarned);
      
      console.log('✅ Payment converted successfully');
      return true;
    } catch (error) {
      console.error('Error converting payment:', error);
      throw error;
    }
  }

  // Investor conversion methods
  async convertInvestmentToLand(userId, landType, investmentAmount, squaresEarned) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('🔄 Converting investment to land:', { userId, landType, investmentAmount, squaresEarned });
      
      // Add the land rewards
      await this.addReward(userId, landType, squaresEarned);
      
      // Optionally track investment conversions in a separate table
      try {
        const investmentTable = base('Investment Conversions');
        await investmentTable.create({
          user_id: userId,
          land_type: landType,
          investment_amount: investmentAmount,
          squares_earned: squaresEarned,
          converted_date: new Date().toISOString(),
          status: 'completed'
        });
      } catch (tableError) {
        // Investment tracking table might not exist, but that's okay
        console.log('Investment tracking table not available, continuing...');
      }
      
      console.log('✅ Investment converted successfully');
      return true;
    } catch (error) {
      console.error('Error converting investment:', error);
      throw error;
    }
  }

  async getUserInvestmentHistory(userId) {
    if (!this.isConnected) {
      throw new Error('Airtable not configured');
    }

    try {
      console.log('📊 Fetching investment history for user:', userId);
      
      const investmentTable = base('Investment Conversions');
      
      const records = await investmentTable.select({
        filterByFormula: `{user_id} = '${userId}'`,
        sort: [{ field: 'converted_date', direction: 'desc' }]
      }).all();
      
      console.log('📊 Found', records.length, 'investment conversions');
      
      return records.map(record => ({
        id: record.id,
        userId: record.fields.user_id,
        landType: record.fields.land_type,
        investmentAmount: record.fields.investment_amount || 0,
        squaresEarned: record.fields.squares_earned || 0,
        convertedDate: record.fields.converted_date,
        status: record.fields.status || 'completed'
      }));
    } catch (error) {
      console.error('Error fetching investment history:', error);
      // Return empty array if table doesn't exist
      return [];
    }
  }

  // Check connection status
  isAirtableConnected() {
    return this.isConnected;
  }
}

export default new AirtableService();