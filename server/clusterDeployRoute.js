const express = require('express');
const k8s = require('@kubernetes/client-node');

const router = express.Router();

/**
 * Write an SSE event to the response.
 */
function send(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendLog(res, phase, message, logType = 'info', nodeName = undefined) {
  send(res, { type: 'log', phase, message, logType, nodeName });
}

function sendPhase(res, phase) {
  send(res, { type: 'phase', phase });
}

function sendError(res, message) {
  send(res, { type: 'error', message });
}

function sendDone(res) {
  send(res, { type: 'done' });
}

/**
 * Apply a single parsed Kubernetes object — create it if missing, patch if present.
 */
async function applyObject(client, obj) {
  try {
    await client.read(obj);
    // Resource exists — patch it
    await client.patch(
      obj,
      undefined,
      undefined,
      undefined,
      true,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );
    return 'patched';
  } catch (e) {
    if (e.response && e.response.statusCode === 404) {
      await client.create(obj);
      return 'created';
    }
    throw e;
  }
}

/**
 * Apply all objects from a multi-document YAML string.
 * Returns an array of { name, kind, action } results.
 */
async function applyYaml(client, yamlStr) {
  const objects = k8s.loadAllYaml(yamlStr).filter(Boolean);
  const results = [];
  for (const obj of objects) {
    if (!obj || !obj.kind) continue;
    const action = await applyObject(client, obj);
    results.push({ name: obj.metadata?.name, kind: obj.kind, action });
  }
  return results;
}

/**
 * Poll a resource until its status looks healthy or until timeout.
 */
async function pollReady(client, obj, timeoutMs = 120000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await client.read(obj);
      const resource = response.body;
      const conditions = resource?.status?.conditions || [];
      const readyCondition = conditions.find(
        (c) => c.type === 'Ready' || c.type === 'Available'
      );
      if (readyCondition && readyCondition.status === 'True') {
        return { ready: true, resource };
      }
      // Jobs: check completions
      if (obj.kind === 'Job') {
        const succeeded = resource?.status?.succeeded || 0;
        if (succeeded > 0) return { ready: true, resource };
        const failed = resource?.status?.failed || 0;
        if (failed > 0) return { ready: false, resource, reason: 'Job failed' };
      }
    } catch {
      // Resource not yet visible — keep polling
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return { ready: false, reason: 'Timed out waiting for resource to be Ready' };
}

// POST /api/cluster-deploy
router.post('/', async (req, res) => {
  // Set SSE headers immediately
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:9000');
  res.flushHeaders();

  const { kubeconfig, manifests, globals } = req.body;

  if (!kubeconfig || !manifests || !globals) {
    sendError(res, 'Missing required fields: kubeconfig, manifests, globals');
    res.end();
    return;
  }

  try {
    // ── Phase 1: Validate ─────────────────────────────────────────────────
    sendPhase(res, 1);
    sendLog(res, 1, 'Parsing kubeconfig...', 'info');

    const kc = new k8s.KubeConfig();
    try {
      kc.loadFromString(kubeconfig);
    } catch (e) {
      sendError(res, `Invalid kubeconfig: ${e.message}`);
      res.end();
      return;
    }

    const currentContext = kc.getCurrentContext();
    const cluster = kc.getCurrentCluster();
    sendLog(res, 1, `Context: ${currentContext}`, 'info');
    sendLog(res, 1, `Cluster: ${cluster?.server || 'unknown'}`, 'info');

    // Verify connectivity by listing the target namespace
    const coreClient = kc.makeApiClient(k8s.CoreV1Api);
    const dynamicClient = k8s.KubernetesObjectApi.makeApiClient(kc);
    const namespace = globals.namespace || 'default';

    sendLog(res, 1, `Checking namespace "${namespace}"...`, 'info');
    try {
      await coreClient.readNamespace({ name: namespace });
      sendLog(res, 1, `Namespace "${namespace}" exists`, 'success');
    } catch (e) {
      if (e.response && e.response.statusCode === 404) {
        sendLog(res, 1, `Namespace "${namespace}" not found — creating it...`, 'warning');
        await coreClient.createNamespace({
          body: { metadata: { name: namespace } },
        });
        sendLog(res, 1, `Namespace "${namespace}" created`, 'success');
      } else {
        sendError(res, `Cannot connect to cluster: ${e.message || JSON.stringify(e.body)}`);
        res.end();
        return;
      }
    }
    sendLog(res, 1, 'Pre-flight checks passed', 'success');

    // Helper: apply a manifest by resourceType from the manifests array
    const getManifests = (types) =>
      manifests.filter((m) => types.includes(m.resourceType));

    const applyManifest = async (m, phase) => {
      sendLog(res, phase, `Applying ${m.resourceType} "${m.nodeName}"...`, 'info', m.nodeName);
      try {
        const results = await applyYaml(dynamicClient, m.yaml);
        for (const r of results) {
          sendLog(res, phase, `  ${r.kind}/${r.name} ${r.action}`, 'success', m.nodeName);
        }
        return { ok: true };
      } catch (e) {
        const msg = e.body?.message || e.message || String(e);
        sendLog(res, phase, `  Error applying ${m.resourceType}: ${msg}`, 'error', m.nodeName);
        return { ok: false, error: msg };
      }
    };

    // ── Phase 2: Infrastructure ───────────────────────────────────────────
    sendPhase(res, 2);
    sendLog(res, 2, 'Deploying infrastructure resources...', 'info');
    const infraManifests = getManifests(['oci-secret', 'serving-runtime', 'pvc', 'rbac']);
    for (const m of infraManifests) {
      await applyManifest(m, 2);
    }
    sendLog(res, 2, 'Infrastructure resources applied', 'success');

    // ── Phase 3: Services ─────────────────────────────────────────────────
    sendPhase(res, 3);
    sendLog(res, 3, 'Deploying services...', 'info');
    const serviceManifests = getManifests(['inference-service', 'notebook']);
    for (const m of serviceManifests) {
      await applyManifest(m, 3);
    }
    sendLog(res, 3, 'Service resources applied', 'success');

    // ── Phase 4: Jobs ─────────────────────────────────────────────────────
    sendPhase(res, 4);
    sendLog(res, 4, 'Running initialization jobs...', 'info');
    const jobManifests = getManifests(['job']);
    for (const m of jobManifests) {
      await applyManifest(m, 4);
    }
    if (jobManifests.length === 0) {
      sendLog(res, 4, 'No jobs configured — skipping', 'info');
    }

    // ── Phase 5: Health Checks ────────────────────────────────────────────
    sendPhase(res, 5);
    sendLog(res, 5, 'Running health checks...', 'info');

    const serviceCheckManifests = getManifests(['inference-service', 'notebook']);
    for (const m of serviceCheckManifests) {
      const objects = k8s.loadAllYaml(m.yaml).filter((o) => o && o.kind);
      for (const obj of objects) {
        sendLog(res, 5, `Waiting for ${obj.kind}/${obj.metadata?.name} to be ready...`, 'info', m.nodeName);
        const result = await pollReady(dynamicClient, obj, 120000);
        if (result.ready) {
          sendLog(res, 5, `${obj.kind}/${obj.metadata?.name} is ready`, 'success', m.nodeName);
        } else {
          sendLog(res, 5, `${obj.kind}/${obj.metadata?.name}: ${result.reason || 'not ready yet'}`, 'warning', m.nodeName);
        }
      }
    }

    const jobCheckManifests = getManifests(['job']);
    for (const m of jobCheckManifests) {
      const objects = k8s.loadAllYaml(m.yaml).filter((o) => o && o.kind === 'Job');
      for (const obj of objects) {
        sendLog(res, 5, `Waiting for Job/${obj.metadata?.name} to complete...`, 'info', m.nodeName);
        const result = await pollReady(dynamicClient, obj, 120000);
        if (result.ready) {
          sendLog(res, 5, `Job/${obj.metadata?.name} completed`, 'success', m.nodeName);
        } else {
          sendLog(res, 5, `Job/${obj.metadata?.name}: ${result.reason || 'not completed yet'}`, 'warning', m.nodeName);
        }
      }
    }

    // ── Phase 6: Ready ────────────────────────────────────────────────────
    sendPhase(res, 6);
    sendLog(res, 6, 'All health checks passed', 'success');
    sendLog(res, 6, `Deployment complete! Namespace: ${namespace}`, 'success');

    // Surface endpoint URLs from InferenceService status
    const isManifests = getManifests(['inference-service']);
    for (const m of isManifests) {
      const objects = k8s.loadAllYaml(m.yaml).filter((o) => o && o.kind === 'InferenceService');
      for (const obj of objects) {
        try {
          const resp = await dynamicClient.read(obj);
          const url = resp.body?.status?.url;
          if (url) {
            sendLog(res, 6, `Model endpoint: ${url}`, 'success', m.nodeName);
          }
        } catch {
          // Not critical if we can't read the URL
        }
      }
    }

    sendDone(res);
    console.log(`✅ Cluster deploy complete — namespace: ${namespace}`);
  } catch (error) {
    console.error('Cluster deploy error:', error);
    sendError(res, `Deployment failed: ${error.message || String(error)}`);
  }

  res.end();
});

module.exports = router;
