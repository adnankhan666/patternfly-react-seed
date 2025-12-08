const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authMiddleware } = require('./middleware/auth');
const workflowRoutes = require('./workflowRoutes');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const executionRoutes = require('./executionRoutes');
const modelRoutes = require('./modelRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const experimentRoutes = require('./experimentRoutes');
const notebookRoutes = require('./notebookRoutes');
const trainingRoutes = require('./trainingRoutes');
const Project = require('./models/Project');
const Execution = require('./models/Execution');
const RegisteredModel = require('./models/RegisteredModel');
const Workflow = require('./models/Workflow');
const Pipeline = require('./models/Pipeline');
const Experiment = require('./models/Experiment');
const Notebook = require('./models/Notebook');
const TrainingJob = require('./models/TrainingJob');
const { isDBConnected } = require('./database');
const router = express.Router();

// Authentication routes (public)
router.use('/auth', authRoutes);

// Protected routes - require authentication
router.use('/workflows', authMiddleware, workflowRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/executions', authMiddleware, executionRoutes);
router.use('/models', authMiddleware, modelRoutes);
router.use('/pipelines', authMiddleware, pipelineRoutes);
router.use('/experiments', authMiddleware, experimentRoutes);
router.use('/notebooks', authMiddleware, notebookRoutes);
router.use('/training', authMiddleware, trainingRoutes);

// Initialize Google Generative AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  return new GoogleGenerativeAI(apiKey);
};

// Fetch fresh data from database for chatbot context
async function fetchFreshContext() {
  if (!isDBConnected()) {
    return null;
  }

  try {
    const [projects, models, executions, workflows, pipelines, experiments, notebooks, trainingJobs] = await Promise.all([
      Project.find({}).limit(100),
      RegisteredModel.find({}).limit(100),
      Execution.find({}).sort({ startTime: -1 }).limit(50),
      Workflow.find({}).limit(50),
      Pipeline.find({}).limit(100),
      Experiment.find({}).limit(100),
      Notebook.find({}).limit(100),
      TrainingJob.find({}).limit(100),
    ]);

    return {
      projects: projects.map(p => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        owner: p.owner,
        phase: p.phase,
        tags: p.tags,
        collaborators: p.collaborators,
        workflowCount: p.workflowCount,
      })),
      modelRegistry: models.map(m => {
        const customProps = m.customProperties instanceof Map
          ? Object.fromEntries(m.customProperties)
          : (m.customProperties || {});
        return {
          id: m.modelId,
          name: m.name,
          owner: m.owner,
          state: m.state,
          stage: m.state,
          description: m.description,
          framework: customProps.framework || 'unknown',
          version: customProps.version || 'unknown',
          accuracy: customProps.accuracy
            ? Math.round(customProps.accuracy * 100)
            : 0,
        };
      }),
      pipelineRuns: executions.map(e => ({
        id: e.executionId,
        name: e.workflowName,
        status: e.status,
        triggeredBy: e.triggeredBy,
        progress: e.progress,
        totalNodes: e.totalNodes,
        completedNodes: e.completedNodes,
        failedNodes: e.failedNodes,
      })),
      workflows: workflows.map(w => ({
        id: w.workflowId,
        name: w.name,
        description: w.description,
        status: w.status,
        version: w.version,
        createdBy: w.createdBy,
      })),
      pipelines: pipelines.map(p => ({
        id: p.pipelineId,
        name: p.name,
        description: p.description,
        status: p.status,
        owner: p.owner,
        version: p.version,
        runsCount: p.runsCount,
        successRate: p.successRate,
        tags: p.tags,
      })),
      experiments: experiments.map(e => ({
        id: e.experimentId,
        name: e.name,
        description: e.description,
        status: e.status,
        owner: e.owner,
        framework: e.framework,
        parameters: e.parameters,
        metrics: e.metrics,
      })),
      notebooks: notebooks.map(n => ({
        id: n.notebookId,
        name: n.name,
        description: n.description,
        status: n.status,
        owner: n.owner,
        image: n.image,
        size: n.size,
        gpus: n.gpus,
      })),
      trainingJobs: trainingJobs.map(t => ({
        id: t.jobId,
        name: t.name,
        description: t.description,
        status: t.status,
        framework: t.framework,
        modelType: t.modelType,
        owner: t.owner,
        metrics: t.metrics,
        resources: t.resources,
      })),
    };
  } catch (error) {
    console.error('Error fetching context from database:', error);
    return null;
  }
}

// POST /api/chat - Send message to Gemini AI (Protected endpoint)
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // Input validation - prevent excessively long messages
    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message is too long. Maximum 4000 characters allowed.' });
    }

    // Sanitize message - trim whitespace
    const sanitizedMessage = message.trim();

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Fetch FRESH data directly from database - ignore frontend context
    const freshContext = await fetchFreshContext();
    const contextInfo = freshContext ? formatAppContext(freshContext) : 'No database connection - limited functionality.';

    // Debug: Log what we fetched
    console.log('API /chat - Fetched FRESH context from DB:', {
      hasContext: !!freshContext,
      projectCount: freshContext?.projects?.length || 0,
      modelCount: freshContext?.modelRegistry?.length || 0,
      executionCount: freshContext?.pipelines?.length || 0,
      workflowCount: freshContext?.experiments?.length || 0,
    });

    const systemInstruction = `You are an AI assistant for the Open Data Hub dashboard.

${contextInfo}

===========================
TERMINOLOGY:
===========================

"Canvas" = Data Science Projects (the === PROJECTS === section above)
When users ask about "Canvas projects", they mean the projects listed in the === PROJECTS === section.

===========================
ABSOLUTE RULES - NO EXCEPTIONS:
===========================

1. YOU MUST ONLY USE DATA FROM THE SECTIONS ABOVE (marked with ===)
2. DO NOT INVENT, CREATE, OR HALLUCINATE ANY DATA
3. DO NOT USE PLACEHOLDER NAMES LIKE "Model A", "Model B", "Project X"
4. IF THE CONTEXT IS EMPTY OR DOESN'T HAVE THE REQUESTED DATA, SAY "No data available"
5. QUOTE EXACT NAMES from the sections above - copy them character-by-character

===========================
HOW TO ANSWER:
===========================

When asked about "Canvas" or "Canvas projects":
- Look at the === PROJECTS === section above
- List ALL projects you see there
- Copy the EXACT names you see there

When asked to "list models" or "show models":
- Look at the === MODEL REGISTRY === section above
- Copy the EXACT names you see there
- Use the EXACT accuracy, framework, and version numbers shown
- DO NOT add models that aren't listed
- DO NOT change any names or numbers

===========================
WRONG ANSWERS (NEVER DO THIS):
===========================
❌ Model A (Accuracy: 95%, Size: 500MB)
❌ Model B (Accuracy: 93%, Size: 250MB)
❌ Project X, Project Y, Project Z

===========================
RIGHT ANSWERS (ALWAYS DO THIS):
===========================
✅ Live Production Model v2.0: Framework: tensorflow, Accuracy: 95%
✅ BERT Language Model v1.0: Framework: transformers, Accuracy: 92%

If you cannot find the exact data in the sections above, respond with:
"I cannot find this information in the current data. The available data shows: [list what you actually see]"

REMEMBER: Only use data from the === sections above. Never invent data.`;

    // Convert conversation history to Gemini format
    const history = (conversationHistory || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // For first message, prepend system instruction to establish context
    // For subsequent messages, use history which already has the context
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;

    // Start a chat with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0, // Zero temperature for completely deterministic, factual responses
        topP: 0.1, // Very low topP to prevent creativity
        topK: 1, // Only consider the most likely token
      },
    });

    // Send the message
    // For first message: include system instruction as context (not mixed with user input)
    // For follow-ups: send sanitized user message only (context is in history)
    const messageToSend = isFirstMessage
      ? `${systemInstruction}\n\n---USER MESSAGE---\n${sanitizedMessage}`
      : sanitizedMessage;

    const result = await chat.sendMessage(messageToSend);
    const response = await result.response;
    const text = response.text();

    res.json({
      response: text || 'I apologize, but I was unable to generate a response. Please try again.',
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);

    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        error: 'API key not configured. Please contact administrator.',
      });
    }

    res.status(500).json({
      error: error.message || 'An unexpected error occurred. Please try again.',
    });
  }
});

// Helper function to format application context
function formatAppContext(context) {
  if (!context) {
    return 'No context available.';
  }

  let contextStr = '';

  // Projects context
  if (context.projects && context.projects.length > 0) {
    const projectInfo = context.projects.map(proj =>
      `- ${proj.displayName || proj.name}: Owner: ${proj.owner}, Phase: ${proj.phase}, Description: ${proj.description || 'N/A'}, Workflows: ${proj.workflowCount || 0}`
    ).join('\n');
    contextStr += `\n\n=== PROJECTS (${context.projects.length}) ===\n${projectInfo}`;
  }

  // Model Registry context
  if (context.modelRegistry && context.modelRegistry.length > 0) {
    const registryInfo = context.modelRegistry.map(model => {
      const accuracy = model.accuracy && model.accuracy > 0
        ? `${model.accuracy}%`
        : 'No accuracy data';
      return `- ${model.name}: Framework: ${model.framework}, Version: ${model.version}, Accuracy: ${accuracy}, State: ${model.state}, Owner: ${model.owner}`;
    }).join('\n');
    contextStr += `\n\n=== MODEL REGISTRY (${context.modelRegistry.length}) ===\n${registryInfo}`;
  }

  // Pipelines context
  if (context.pipelines && context.pipelines.length > 0) {
    const pipelineInfo = context.pipelines.map(pipeline =>
      `- ${pipeline.name}: Status: ${pipeline.status}, Owner: ${pipeline.owner}, Version: ${pipeline.version}, Runs: ${pipeline.runsCount}, Success Rate: ${pipeline.successRate}%`
    ).join('\n');
    contextStr += `\n\n=== DATA PIPELINES (${context.pipelines.length}) ===\n${pipelineInfo}`;
  }

  // Experiments context
  if (context.experiments && context.experiments.length > 0) {
    const expInfo = context.experiments.map(exp => {
      const metricsStr = exp.metrics ? Object.entries(exp.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') : 'No metrics';
      return `- ${exp.name}: Status: ${exp.status}, Framework: ${exp.framework}, Owner: ${exp.owner}, Metrics: ${metricsStr}`;
    }).join('\n');
    contextStr += `\n\n=== EXPERIMENTS (${context.experiments.length}) ===\n${expInfo}`;
  }

  // Notebooks context
  if (context.notebooks && context.notebooks.length > 0) {
    const notebookInfo = context.notebooks.map(nb =>
      `- ${nb.name}: Status: ${nb.status}, Owner: ${nb.owner}, Image: ${nb.image}, Size: ${nb.size}, GPUs: ${nb.gpus}`
    ).join('\n');
    contextStr += `\n\n=== NOTEBOOKS (${context.notebooks.length}) ===\n${notebookInfo}`;
  }

  // Training Jobs context
  if (context.trainingJobs && context.trainingJobs.length > 0) {
    const trainingInfo = context.trainingJobs.map(job => {
      const metricsStr = job.metrics ? Object.entries(job.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') : 'No metrics';
      return `- ${job.name}: Status: ${job.status}, Framework: ${job.framework}, Model Type: ${job.modelType || 'N/A'}, Owner: ${job.owner}, Metrics: ${metricsStr}`;
    }).join('\n');
    contextStr += `\n\n=== TRAINING JOBS (${context.trainingJobs.length}) ===\n${trainingInfo}`;
  }

  // Pipeline Runs / Executions context
  if (context.pipelineRuns && context.pipelineRuns.length > 0) {
    const runInfo = context.pipelineRuns.map(run =>
      `- ${run.name}: Status: ${run.status}, Triggered By: ${run.triggeredBy}, Progress: ${run.progress}%, Nodes: ${run.completedNodes}/${run.totalNodes} completed, Failed: ${run.failedNodes}`
    ).join('\n');
    contextStr += `\n\n=== PIPELINE RUNS (${context.pipelineRuns.length}) ===\n${runInfo}`;
  }

  // Workflows context
  if (context.workflows && context.workflows.length > 0) {
    const workflowInfo = context.workflows.map(w =>
      `- ${w.name}: Status: ${w.status}, Version: ${w.version}, Created By: ${w.createdBy}, Description: ${w.description || 'N/A'}`
    ).join('\n');
    contextStr += `\n\n=== WORKFLOWS (${context.workflows.length}) ===\n${workflowInfo}`;
  }

  return contextStr || 'No context available.';
}

module.exports = router;
