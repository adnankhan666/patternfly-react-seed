import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Initialize Google Generative AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('API key not configured. Please add GEMINI_API_KEY to your .env file.');
  }

  return new GoogleGenerativeAI(apiKey);
};

// Function to format application context for Gemini
const formatAppContext = (context?: AppContext): string => {
  if (!context) {
    return 'No context available.';
  }

  let contextStr = '';

  // Models context
  if (context.models && context.models.length > 0) {
    const modelInfo = context.models.map(model =>
      `- ${model.name}: Version ${model.version}, Status: ${model.status}, Accuracy: ${model.accuracy}%, Latency: ${model.latency}ms, Throughput: ${model.throughput} req/s`
    ).join('\n');
    contextStr += `\n\n=== MODELS (${context.models.length}) ===\n${modelInfo}`;
  }

  // Experiments context
  if (context.experiments && context.experiments.length > 0) {
    const expInfo = context.experiments.map(exp =>
      `- ${exp.name} (${exp.id}): Status: ${exp.status}, Framework: ${exp.framework}, Owner: ${exp.owner}`
    ).join('\n');
    contextStr += `\n\n=== EXPERIMENTS (${context.experiments.length}) ===\n${expInfo}`;
  }

  // Pipelines context
  if (context.pipelines && context.pipelines.length > 0) {
    const pipelineInfo = context.pipelines.map(pipeline =>
      `- ${pipeline.name} (${pipeline.id}): Status: ${pipeline.status}, Success: ${pipeline.success}, Duration: ${pipeline.duration}`
    ).join('\n');
    contextStr += `\n\n=== PIPELINES (${context.pipelines.length}) ===\n${pipelineInfo}`;
  }

  // Projects context
  if (context.projects && context.projects.length > 0) {
    const projectInfo = context.projects.map(proj =>
      `- ${proj.name}: ${proj.description}, Team: ${proj.team}, Status: ${proj.status}`
    ).join('\n');
    contextStr += `\n\n=== PROJECTS (${context.projects.length}) ===\n${projectInfo}`;
  }

  // Notebooks context
  if (context.notebooks && context.notebooks.length > 0) {
    const notebookInfo = context.notebooks.map(nb =>
      `- ${nb.name}: Status: ${nb.status}, Framework: ${nb.framework}, Owner: ${nb.owner}, Size: ${nb.size}`
    ).join('\n');
    contextStr += `\n\n=== NOTEBOOKS (${context.notebooks.length}) ===\n${notebookInfo}`;
  }

  // Model Registry context
  if (context.modelRegistry && context.modelRegistry.length > 0) {
    const registryInfo = context.modelRegistry.map(model =>
      `- ${model.name} v${model.version}: Framework: ${model.framework}, Accuracy: ${model.accuracy}%, Stage: ${model.stage}`
    ).join('\n');
    contextStr += `\n\n=== MODEL REGISTRY (${context.modelRegistry.length}) ===\n${registryInfo}`;
  }

  // Workflow context
  if (context.nodes && context.connections) {
    if (context.nodes.length > 0 || context.connections.length > 0) {
      const nodeInfo = context.nodes.map(node =>
        `- ${node.label} (${node.type}): ${node.data?.description || 'No description'}`
      ).join('\n');

      const connectionInfo = context.connections.length > 0
        ? `\nConnections:\n${context.connections.map(conn => {
            const sourceNode = context.nodes?.find((n: any) => n.id === conn.source);
            const targetNode = context.nodes?.find((n: any) => n.id === conn.target);
            return `- ${sourceNode?.label || 'Unknown'} → ${targetNode?.label || 'Unknown'}`;
          }).join('\n')}`
        : '\nNo connections between nodes.';

      contextStr += `\n\n=== WORKFLOW: ${context.projectName || 'Unnamed'} ===\nNodes:\n${nodeInfo}${connectionInfo}`;
    }
  }

  return contextStr || 'No context available.';
};

// Main function to send message to Gemini (kept name for compatibility)
export const sendMessageToClaude = async (
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  appContext?: AppContext
): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build the system instruction with context
    const contextInfo = appContext ? formatAppContext(appContext) : '';

    const systemInstruction = `You are Gemini, an AI assistant for the Open Data Hub dashboard - a comprehensive ML/AI platform.

${contextInfo}

You can help users with:
- **Models**: Search, compare, and recommend models from the catalog
- **Experiments**: Track and analyze ML experiments and their metrics
- **Pipelines**: Monitor and troubleshoot data and ML pipelines
- **Projects**: Manage ML projects and their components
- **Notebooks**: Information about Jupyter notebooks and development environments
- **Model Registry**: Version control and deployment stages for models
- **Workflows**: Build and connect workflow nodes for ML pipelines
- **General ML/AI**: Explain concepts, suggest best practices, troubleshoot issues

When answering:
1. Use the context data above to provide specific, accurate information
2. If asked about specific items (e.g., "show me Model-A"), search the context and provide detailed info
3. For comparisons, analyze multiple items and highlight differences
4. Be concise but thorough
5. If information isn't in the context, say so clearly

Be helpful, accurate, and friendly!`;

    // Convert conversation history to Gemini format
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start a chat with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Send the user message with system instruction prepended to first message
    const prompt = conversationHistory.length === 0
      ? `${systemInstruction}\n\nUser: ${userMessage}`
      : userMessage;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return text || 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return 'API key not configured. Please add your Gemini API key to the .env file and restart the development server.';
      }
      return `Error: ${error.message}`;
    }

    return 'An unexpected error occurred. Please check the console for details.';
  }
};
