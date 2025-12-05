import { useState, useEffect } from 'react';
import { AppContext } from '@app/services/claudeService';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Custom hook to fetch all application data from the backend API
 * This provides real-time data to the chatbot for context-aware responses
 */
export const useAppData = () => {
  const [appData, setAppData] = useState<AppContext>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch data from all API endpoints in parallel
        const [projectsRes, modelsRes, executionsRes, workflowsRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/projects`).then(r => r.ok ? r.json() : { projects: [] }),
          fetch(`${API_URL}/api/models`).then(r => r.ok ? r.json() : { models: [] }),
          fetch(`${API_URL}/api/executions`).then(r => r.ok ? r.json() : { executions: [] }),
          fetch(`${API_URL}/api/workflows`).then(r => r.ok ? r.json() : { workflows: [] }),
        ]);

        // Extract data from settled promises
        const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.projects : [];
        const models = modelsRes.status === 'fulfilled' ? modelsRes.value.models : [];
        const executions = executionsRes.status === 'fulfilled' ? executionsRes.value.executions : [];
        const workflows = workflowsRes.status === 'fulfilled' ? workflowsRes.value.workflows : [];

        // Build combined app context for chatbot
        const combinedData: AppContext = {
          projects: projects.map((p: any) => ({
            name: p.name,
            displayName: p.displayName,
            description: p.description,
            owner: p.owner,
            phase: p.phase,
            tags: p.tags,
            workflowCount: p.workflowCount,
            collaborators: p.collaborators,
          })),
          modelRegistry: models.map((m: any) => ({
            id: m.modelId,
            name: m.name,
            owner: m.owner,
            state: m.state,
            stage: m.state, // Map state to stage for backend compatibility
            description: m.description,
            framework: m.customProperties?.framework || 'unknown',
            version: m.customProperties?.version || 'unknown',
            // Convert accuracy from decimal to percentage (0.95 -> 95)
            accuracy: m.customProperties?.accuracy
              ? Math.round(m.customProperties.accuracy * 100)
              : 0,
          })),
          pipelines: executions.map((e: any) => ({
            id: e.executionId,
            name: e.workflowName,
            status: e.status,
            triggeredBy: e.triggeredBy,
            startTime: e.startTime,
            endTime: e.endTime,
            duration: e.duration,
            progress: e.progress,
            totalNodes: e.totalNodes,
            completedNodes: e.completedNodes,
            failedNodes: e.failedNodes,
          })),
          // Add workflows data
          experiments: workflows.map((w: any) => ({
            id: w.workflowId,
            name: w.name,
            description: w.description,
            status: w.status,
            version: w.version,
            createdBy: w.createdBy,
            nodes: w.nodes?.length || 0,
            connections: w.connections?.length || 0,
          })),
        };

        setAppData(combinedData);
        setError(null);

        // Debug: Log fetched data counts
        console.log('useAppData - Fetched data:', {
          projects: combinedData.projects?.length || 0,
          models: combinedData.modelRegistry?.length || 0,
          executions: combinedData.pipelines?.length || 0,
          experiments: combinedData.experiments?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching application data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch application data');
        // Set empty data on error so chatbot can still function
        setAppData({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Refresh data every 30 seconds to keep chatbot context up to date
    const interval = setInterval(fetchAllData, 30000);

    return () => clearInterval(interval);
  }, []);

  return { appData, loading, error };
};
