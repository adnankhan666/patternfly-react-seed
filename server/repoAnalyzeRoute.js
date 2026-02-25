const express = require('express');
const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

/**
 * Parse a GitHub URL into { owner, repo }
 * Handles: https://github.com/owner/repo, https://github.com/owner/repo.git, git@github.com:owner/repo
 */
function parseGitHubUrl(url) {
  try {
    const match = url.trim().match(/github\.com[/:]([^/\s]+)\/([^/\s.]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

/**
 * Fetch a single file from the GitHub Contents API.
 * Returns decoded UTF-8 string (capped at 4000 chars) or null if not found.
 */
function fetchGitHubFile(owner, repo, filePath, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`,
      headers: {
        'User-Agent': 'OpenDataHub-Canvas/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    };

    const req = https.get(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.content && parsed.encoding === 'base64') {
            const text = Buffer.from(parsed.content, 'base64').toString('utf-8');
            resolve(text.slice(0, 4000));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

/**
 * Fetch the root directory listing of a repo.
 * Returns a plain-text list like "[file] README.md\n[dir] helm\n..." or null.
 */
function fetchRootListing(owner, repo, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`,
      headers: {
        'User-Agent': 'OpenDataHub-Canvas/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    };

    const req = https.get(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const files = JSON.parse(raw);
          if (Array.isArray(files)) {
            resolve(files.map((f) => `${f.type === 'dir' ? '[dir]' : '[file]'} ${f.name}`).join('\n'));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// POST /api/repo-analyze
router.post('/', async (req, res) => {
  try {
    const { repoUrl, githubToken } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({
        error: 'Invalid GitHub URL. Expected: https://github.com/owner/repo',
      });
    }

    const { owner, repo } = parsed;
    const token = githubToken || null;

    console.log(`🔍 Analyzing repo: ${owner}/${repo}`);

    // Fetch all key files in parallel
    const [rootListing, readme, requirements, dockerfile, setupPy, pyproject] =
      await Promise.all([
        fetchRootListing(owner, repo, token),
        fetchGitHubFile(owner, repo, 'README.md', token),
        fetchGitHubFile(owner, repo, 'requirements.txt', token),
        fetchGitHubFile(owner, repo, 'Dockerfile', token),
        fetchGitHubFile(owner, repo, 'setup.py', token),
        fetchGitHubFile(owner, repo, 'pyproject.toml', token),
      ]);

    // If we got nothing, the repo is likely private, doesn't exist, or we're rate limited
    if (!rootListing && !readme && !requirements && !dockerfile) {
      return res.status(404).json({
        error:
          'Could not fetch repository files. This can mean: (1) GitHub API rate limit hit — add a GitHub token to get 5000 req/hr instead of 60, (2) the repo is private — supply a token with repo:read scope, or (3) the URL is incorrect.',
      });
    }

    // Build context string for the prompt
    const sections = [];
    if (rootListing) sections.push(`--- ROOT FILES ---\n${rootListing}`);
    if (readme) sections.push(`--- README.md ---\n${readme}`);
    if (requirements) sections.push(`--- requirements.txt ---\n${requirements}`);
    if (dockerfile) sections.push(`--- Dockerfile ---\n${dockerfile}`);
    if (setupPy) sections.push(`--- setup.py ---\n${setupPy}`);
    if (pyproject) sections.push(`--- pyproject.toml ---\n${pyproject}`);
    const repoContext = sections.join('\n\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-2.5-flash is the only model available on new API keys.
    // It's a thinking model — must use v1beta and set thinkingBudget:0 to get clean JSON output.
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      { apiVersion: 'v1beta' }
    );

    const prompt = `You are a Kubernetes and MLOps deployment expert. Analyze the GitHub repository files below and generate a Helm deployment workflow template for it.

OUTPUT RULES (strictly follow):
- Output ONLY a single valid JSON object. No markdown code fences, no explanation text, nothing before or after the JSON.
- The JSON must exactly match the TypeScript structure shown at the bottom.
- Use ONLY these node types: oci-secret, serving-runtime, inference-service, pvc, rbac, notebook, job
- Generate 4–7 nodes total. Position them logically across the canvas:
    Level 0 (infrastructure): y=100, x spread across 50–800
    Level 1 (services): y=300, x spread across 50–800  
    Level 2 (jobs): y=500, x same column as their parent node
- Connections use "bottom"→"top" for vertical dependencies, "right"→"left" for horizontal
- Pre-fill helmConfig.values with real values inferred from the repo (model name, image, git URL, etc.)
- Use placeholder strings like "<model-name>" only when the value truly cannot be inferred

NODE COLORS (use exactly):
  oci-secret: "#f59e0b"
  serving-runtime: "#ef4444"
  inference-service: "#8b5cf6"
  pvc: "#06b6d4"
  rbac: "#f97316"
  notebook: "#ec4899"
  job: "#22c55e"

REQUIRED JSON STRUCTURE:
{
  "id": "repo-generated-${Date.now()}",
  "name": "<Short descriptive name, e.g. 'LLaMA 3 Deployment'>",
  "description": "<One sentence describing what this deploys>",
  "category": "helm-quickstart",
  "icon": "🐙",
  "nodes": [
    {
      "id": "node-oci-secret",
      "type": "oci-secret",
      "label": "OCI Secret",
      "position": { "x": 50, "y": 100 },
      "data": {
        "color": "#f59e0b",
        "description": "Stores OCI model URI as K8s Secret",
        "helmConfig": {
          "resourceType": "oci-secret",
          "values": {
            "name": "<secret-name>",
            "modelUri": "<oci://...>"
          }
        }
      }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "source": "node-oci-secret",
      "target": "node-inference-service",
      "sourceConnector": "bottom",
      "targetConnector": "top"
    }
  ]
}

REPOSITORY: ${owner}/${repo}
${repoContext}

Output the JSON now:`;

    const result = await model.generateContent(prompt);

    const rawText = result.response.text().trim();
    console.log('Gemini raw response (first 500):', rawText.slice(0, 500));

    // Extract the outermost JSON object regardless of surrounding markdown/text
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    const jsonText = firstBrace !== -1 && lastBrace > firstBrace
      ? rawText.slice(firstBrace, lastBrace + 1)
      : rawText;

    let template;
    try {
      template = JSON.parse(jsonText);
    } catch {
      console.error('Gemini returned non-JSON:', jsonText.slice(0, 500));
      return res.status(500).json({
        error: 'AI returned invalid JSON. Please try again.',
        raw: jsonText.slice(0, 500),
      });
    }

    // Sanity check
    if (!template.nodes || !Array.isArray(template.nodes) || template.nodes.length === 0) {
      return res.status(500).json({ error: 'Generated template has no nodes. Please try again.' });
    }

    // Ensure required top-level fields have fallbacks
    template.category = 'helm-quickstart';
    template.icon = template.icon || '🐙';
    if (!template.id || template.id.includes('${')) {
      template.id = `repo-${owner}-${repo}-${Date.now()}`;
    }

    console.log(`✅ Repo analyzed: ${owner}/${repo} → ${template.nodes.length} nodes, ${(template.connections || []).length} connections`);

    return res.json({ template, repoMeta: { owner, repo } });
  } catch (error) {
    console.error('Repo analyze error:', error);
    return res.status(500).json({ error: 'Failed to analyze repository', message: error.message });
  }
});

module.exports = router;
