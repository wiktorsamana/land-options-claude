# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm start` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm test` - Run tests with Jest

### Testing
- `npm test -- --watch` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report

## Architecture Overview

### Core Application Structure
This is a React-based land gamification app where employees collect virtual land squares as rewards. The app uses a service pattern to abstract data sources and supports both Airtable (production) and mock data (development).

### Key Architectural Patterns

**Service Layer Pattern**: The app uses a service abstraction layer to switch between `airtableService` (real data) and `mockService` (development data). The service selection happens automatically based on environment variable presence:
```javascript
const dataService = airtableService.isAirtableConnected() ? airtableService : mockService;
```

**URL-based Routing**: Simple client-side routing in `App.js`:
- `/` - Main land game interface (`LandGameApp`)
- `/bonus-converter` - Employee bonus conversion (`BonusConverterPage`) 
- `/investor-converter` - Investor land purchase interface (`InvestorConverterPage`)

**State Management**: Uses React hooks for state management with key patterns:
- `claimMode` state controls interactive land square selection
- Flip card animations controlled by individual square state
- Real-time data sync with Airtable backend

### Data Architecture

**Airtable Schema** (3 tables):
- **Users**: `user_id`, `name`, `email`, `streak_days`, `total_earnings`
- **Land Squares**: `square_id`, `user_id` (linked), `x_coordinate`, `y_coordinate`, `land_type`, `earned_date`, `is_active`
- **Available Rewards**: `reward_id`, `user_id` (linked), `land_type`, `count`

**Land Types**:
- `jungle plot` - Palm tree SVG icons with swaying animation
- `flathouse` - Building SVG with glowing windows
- `flathouse mini` - House SVG with animated windows

### Key Components

**LandGameApp.js**: Main game interface with 5x5 grid, progress tracking, milestone carousel, and reward claiming. Includes user selection mode for claiming rewards to specific squares.

**LandSquare.js**: Individual grid squares with flip animation, modern SVG icons, and interactive states (claimed/unclaimed/claimable). Uses CSS 3D transforms for card flipping.

**Conversion Modules**: 
- `BonusConverter.js` - Converts employee bonuses to land with 2x multiplier
- `InvestorConverter.js` - Investor purchase interface with different rates per land type

### Visual Features

**Animations**:
- Canvas confetti celebrations on successful actions
- CSS 3D flip cards for land square details
- SVG animations (palm fronds swaying, window glowing)
- Pulse animations for claimable squares

**Styling**: Uses Tailwind CSS with custom CSS for complex animations. Background uses local landscape image (`src/assets/landscape-scaled.jpg`).

## Environment Setup

### Required Environment Variables
```
REACT_APP_AIRTABLE_BASE_ID=app... # Airtable base ID
REACT_APP_AIRTABLE_ACCESS_TOKEN=pat... # Airtable personal access token
```

### Development vs Production
- Missing environment variables automatically switches to mock data mode
- Mock data provides full functionality for development without Airtable setup
- Production mode requires properly configured Airtable base with the 3-table schema

### URL Parameters
- `?userId=employee_001` - Set active user
- `?hideControls=true` - Hide admin controls for embedded views

## Key Development Patterns

### Adding New Land Types
1. Update `getSquareContent()` in `LandSquare.js`
2. Create new SVG icon component
3. Add CSS animations in `LandGameApp.css`
4. Update Airtable schema single-select options

### Data Service Integration
All data operations go through the service layer. Both `airtableService` and `mockService` implement the same interface:
- `getGameData(userId)`
- `claimLandSquare(userId, x, y, type)`
- `updateRewardCount(userId, type, count)`
- `addReward(userId, type, count)`

### Animation Framework
- Land celebrations use `canvas-confetti` library
- Card flips use CSS 3D transforms with `perspective-1000` class
- SVG animations defined in component-specific CSS classes

## Git Commit Guidelines

### Commit After Major Changes
Always commit after completing a major change or feature. Major changes include:
- Adding new components or features
- Modifying game mechanics or data flow
- Updating visual designs or animations
- Fixing bugs that affect functionality
- Refactoring significant code sections

### Commit Message Format
Use clear, descriptive commit messages following this pattern:
- Start with a verb (Add, Update, Fix, Refactor, Remove)
- Be specific about what changed and why
- Reference the component or feature affected

Examples:
- `Add flip card animation to land squares for detail view`
- `Update land types from emoji to modern SVG icons with animations`
- `Fix Airtable field capitalization causing 422 errors`
- `Refactor claim reward to use interactive square selection`
- `Remove jumping animations from success notifications`

### When to Commit
- After implementing a complete feature
- After fixing a bug
- After visual/UX improvements
- Before starting a new unrelated task
- After refactoring that maintains functionality