# 🏞️ Land Empire - Gamification App

A React-based gamification application where employees can collect virtual land squares as rewards. Inspired by sandbox-style games, this app incentivizes performance through visual land ownership progression.

## ✨ Features

- **5x5 Interactive Grid**: Visual land squares with different types (Forest, House, Tree)
- **Reward System**: Claimable rewards that automatically place land on the grid
- **Progress Tracking**: Visual progress bars and completion percentages
- **Real-time Updates**: Live data sync with Airtable backend
- **Gamification Elements**: Streaks, celebrations, and milestone achievements
- **Responsive Design**: Works on desktop and mobile devices
- **Mock Data Mode**: Development mode with demo data

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd land-gamification-app
npm install
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Airtable credentials
# REACT_APP_AIRTABLE_BASE_ID=your_base_id_here
# REACT_APP_AIRTABLE_ACCESS_TOKEN=your_access_token_here
```

### 3. Run the Application
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🛠️ Airtable Setup

### Step 1: Create Airtable Base
1. Go to [airtable.com](https://airtable.com) and create a new base called "Land Gamification"
2. Create three tables with the following structure:

### Table 1: Users
| Field Name | Field Type | Description |
|------------|------------|-------------|
| user_id | Single line text | Primary field (e.g., "employee_001") |
| name | Single line text | Employee name |
| email | Email | Employee email |
| streak_days | Number | Current streak count |
| total_earnings | Currency | Total bonus value |
| created_at | Created time | Auto-generated |

### Table 2: Land Squares
| Field Name | Field Type | Description |
|------------|------------|-------------|
| square_id | Single line text | Primary field (e.g., "user_001_2_3") |
| user_id | Link to Users | Links to Users table |
| x_coordinate | Number | 0-4 for 5x5 grid |
| y_coordinate | Number | 0-4 for 5x5 grid |
| land_type | Single select | Options: Forest, House, Tree |
| earned_date | Date | When square was claimed |
| is_active | Checkbox | Square ownership status |

### Table 3: Available Rewards
| Field Name | Field Type | Description |
|------------|------------|-------------|
| reward_id | Single line text | Primary field |
| user_id | Link to Users | Links to Users table |
| land_type | Single select | Forest, House, Tree |
| count | Number | Available quantity |
| updated_at | Last modified time | Auto-generated |

### Step 2: Get API Credentials
1. Go to [airtable.com/api](https://airtable.com/api)
2. Select your "Land Gamification" base
3. Copy your **Base ID** (starts with "app...")
4. Create a **Personal Access Token**:
   - Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
   - Create new token with scopes: `data.records:read`, `data.records:write`, `schema.bases:read`

### Step 3: Add Sample Data

**Users Table:**
```
user_id: employee_001
name: Alex Johnson
email: alex@company.com
streak_days: 12
total_earnings: 847
```

**Available Rewards Table