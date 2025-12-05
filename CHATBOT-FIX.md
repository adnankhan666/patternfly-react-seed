# Chatbot Real-Time Data Integration

## Problem
The chatbot was using static mock JSON data instead of fetching real data from the database, making it unable to answer questions about actual application state.

## Solution
Created a real-time data integration system that fetches live data from the API endpoints.

## Changes Made

### 1. Created `src/app/hooks/useAppData.ts`
A custom React hook that:
- Fetches data from all API endpoints (projects, models, executions, workflows)
- Combines the data into a unified context for the chatbot
- Auto-refreshes every 30 seconds to keep data current
- Handles errors gracefully with fallback to empty data

### 2. Updated `src/app/AppLayout/AppLayout.tsx`
- Replaced static `allData` import with `useAppData()` hook
- ChatBot now receives real-time data from the database
- Data updates automatically every 30 seconds

## How It Works

```tsx
// Before (static data)
import { allData } from '../data';
<ChatBot workflowContext={allData} />

// After (real-time data)
import { useAppData } from '../hooks/useAppData';
const { appData } = useAppData();
<ChatBot workflowContext={appData} />
```

## API Endpoints Used

The chatbot now has access to real-time data from:
- `GET /api/projects` - All projects from MongoDB
- `GET /api/models` - All registered models
- `GET /api/executions` - Workflow execution history
- `GET /api/workflows` - All workflows

## Example Queries

The chatbot can now answer questions like:
- "What projects do we have?"
- "Show me all active models"
- "Which workflows have failed?"
- "Who owns the ML Training Project?"
- "What's the status of recent executions?"

## Data Refresh
- Data automatically refreshes every 30 seconds
- Ensures chatbot always has up-to-date information
- No manual refresh needed

## Benefits
1. **Real-time Accuracy**: Chatbot answers reflect actual database state
2. **Auto-sync**: Data updates automatically without page refresh
3. **Comprehensive Context**: Access to projects, models, executions, and workflows
4. **Better User Experience**: Users get accurate, current information
