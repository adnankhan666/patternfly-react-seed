// Interface for model data
export interface ModelData {
  name: string;
  accuracy: number;
  latency: number;
  throughput: number;
  version: string;
  status: 'Active' | 'Training' | 'Idle';
}

// Interface for application-wide context
export interface AppContext {
  models?: any[];
  experiments?: any[];
  pipelines?: any[];
  projects?: any[];
  notebooks?: any[];
  modelRegistry?: any[];
  nodes?: any[];
  connections?: any[];
  projectName?: string;
  catalogName?: string;
  currentPage?: string;
}

// Legacy interface for backward compatibility
export interface WorkflowContext extends AppContext {}

// Get API URL from environment or use default
const getApiUrl = (): string => {
  return process.env.API_URL || 'http://localhost:3001';
};

// Main function to send message to backend API (kept name for compatibility)
export const sendMessageToClaude = async (
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  appContext?: AppContext
): Promise<string> => {
  try {
    const apiUrl = getApiUrl();

    // Debug: Log what we're sending
    console.log('claudeService - Sending to API:', {
      hasContext: !!appContext,
      contextKeys: appContext ? Object.keys(appContext) : [],
      projectCount: appContext?.projects?.length || 0,
      modelCount: appContext?.modelRegistry?.length || 0,
    });

    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory,
        appContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error calling chat API:', error);

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return 'Unable to connect to the AI service. Please ensure the backend server is running.';
      }
      if (error.message.includes('API key')) {
        return 'API key not configured on the server. Please contact administrator.';
      }
      return `Error: ${error.message}`;
    }

    return 'An unexpected error occurred. Please check your connection and try again.';
  }
};
