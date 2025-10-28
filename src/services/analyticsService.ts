import mixpanel from 'mixpanel-browser';

// Analytics configuration
const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN || 'dev-token';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Initialize Mixpanel
if (IS_PRODUCTION && MIXPANEL_TOKEN !== 'dev-token') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: false,
    track_pageview: true,
    persistence: 'localStorage',
  });
} else {
  // Dev mode - log to console instead
  mixpanel.init('dev-token', {
    debug: true,
    track_pageview: false,
    persistence: 'localStorage',
  });
}

// Analytics event types
export enum AnalyticsEvent {
  // Workflow events
  WORKFLOW_CREATED = 'workflow_created',
  WORKFLOW_SAVED = 'workflow_saved',
  WORKFLOW_LOADED = 'workflow_loaded',
  WORKFLOW_EXPORTED = 'workflow_exported',
  WORKFLOW_IMPORTED = 'workflow_imported',
  WORKFLOW_EXECUTED = 'workflow_executed',
  WORKFLOW_EXECUTION_COMPLETED = 'workflow_execution_completed',
  WORKFLOW_EXECUTION_FAILED = 'workflow_execution_failed',
  WORKFLOW_CLEARED = 'workflow_cleared',

  // Node events
  NODE_ADDED = 'node_added',
  NODE_DELETED = 'node_deleted',
  NODE_DUPLICATED = 'node_duplicated',
  NODE_MOVED = 'node_moved',
  NODE_RESIZED = 'node_resized',
  NODE_SELECTED = 'node_selected',
  NODE_CONNECTED = 'node_connected',

  // Connection events
  CONNECTION_CREATED = 'connection_created',
  CONNECTION_DELETED = 'connection_deleted',

  // Interaction events
  CANVAS_PANNED = 'canvas_panned',
  CANVAS_ZOOMED = 'canvas_zoomed',
  GRID_TOGGLED = 'grid_toggled',
  UNDO_PERFORMED = 'undo_performed',
  REDO_PERFORMED = 'redo_performed',

  // ChatBot events
  CHAT_OPENED = 'chat_opened',
  CHAT_CLOSED = 'chat_closed',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED = 'chat_response_received',
  CHAT_ERROR = 'chat_error',

  // Keyboard events
  KEYBOARD_SHORTCUT_USED = 'keyboard_shortcut_used',

  // Template events
  TEMPLATE_SELECTED = 'template_selected',
  TEMPLATE_APPLIED = 'template_applied',

  // Error events
  ERROR_OCCURRED = 'error_occurred',
}

// Event properties interface
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 */
export const trackEvent = (
  eventName: AnalyticsEvent | string,
  properties?: AnalyticsProperties
): void => {
  if (IS_PRODUCTION) {
    mixpanel.track(eventName, properties);
  } else {
    console.log(`[Analytics] ${eventName}`, properties);
  }
};

/**
 * Track workflow execution event
 */
export const trackWorkflowExecution = (
  nodeCount: number,
  connectionCount: number,
  duration?: number
): void => {
  trackEvent(AnalyticsEvent.WORKFLOW_EXECUTED, {
    node_count: nodeCount,
    connection_count: connectionCount,
    duration_ms: duration,
    timestamp: Date.now(),
  });
};

/**
 * Track workflow execution completion
 */
export const trackWorkflowExecutionComplete = (
  nodeCount: number,
  duration: number,
  success: boolean
): void => {
  const event = success
    ? AnalyticsEvent.WORKFLOW_EXECUTION_COMPLETED
    : AnalyticsEvent.WORKFLOW_EXECUTION_FAILED;

  trackEvent(event, {
    node_count: nodeCount,
    duration_ms: duration,
    success,
    timestamp: Date.now(),
  });
};

/**
 * Track node operation
 */
export const trackNodeOperation = (
  operation: 'added' | 'deleted' | 'duplicated' | 'moved' | 'resized' | 'selected',
  nodeType?: string,
  nodeId?: string
): void => {
  const eventMap = {
    added: AnalyticsEvent.NODE_ADDED,
    deleted: AnalyticsEvent.NODE_DELETED,
    duplicated: AnalyticsEvent.NODE_DUPLICATED,
    moved: AnalyticsEvent.NODE_MOVED,
    resized: AnalyticsEvent.NODE_RESIZED,
    selected: AnalyticsEvent.NODE_SELECTED,
  };

  trackEvent(eventMap[operation], {
    node_type: nodeType,
    node_id: nodeId,
    timestamp: Date.now(),
  });
};

/**
 * Track connection operation
 */
export const trackConnectionOperation = (
  operation: 'created' | 'deleted',
  sourceId: string,
  targetId: string
): void => {
  const event =
    operation === 'created' ? AnalyticsEvent.CONNECTION_CREATED : AnalyticsEvent.CONNECTION_DELETED;

  trackEvent(event, {
    source_id: sourceId,
    target_id: targetId,
    timestamp: Date.now(),
  });
};

/**
 * Track chatbot interaction
 */
export const trackChatBotInteraction = (
  action: 'opened' | 'closed' | 'message_sent' | 'response_received' | 'error',
  messageLength?: number,
  responseTime?: number
): void => {
  const eventMap = {
    opened: AnalyticsEvent.CHAT_OPENED,
    closed: AnalyticsEvent.CHAT_CLOSED,
    message_sent: AnalyticsEvent.CHAT_MESSAGE_SENT,
    response_received: AnalyticsEvent.CHAT_RESPONSE_RECEIVED,
    error: AnalyticsEvent.CHAT_ERROR,
  };

  trackEvent(eventMap[action], {
    message_length: messageLength,
    response_time_ms: responseTime,
    timestamp: Date.now(),
  });
};

/**
 * Track keyboard shortcut usage
 */
export const trackKeyboardShortcut = (shortcut: string, action: string): void => {
  trackEvent(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, {
    shortcut,
    action,
    timestamp: Date.now(),
  });
};

/**
 * Track canvas interaction
 */
export const trackCanvasInteraction = (
  interaction: 'panned' | 'zoomed' | 'grid_toggled',
  value?: number | boolean
): void => {
  const eventMap = {
    panned: AnalyticsEvent.CANVAS_PANNED,
    zoomed: AnalyticsEvent.CANVAS_ZOOMED,
    grid_toggled: AnalyticsEvent.GRID_TOGGLED,
  };

  trackEvent(eventMap[interaction], {
    value,
    timestamp: Date.now(),
  });
};

/**
 * Track error
 */
export const trackError = (errorMessage: string, errorType: string, context?: string): void => {
  trackEvent(AnalyticsEvent.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_type: errorType,
    context,
    timestamp: Date.now(),
  });
};

/**
 * Track workflow save/load operations
 */
export const trackWorkflowOperation = (
  operation: 'created' | 'saved' | 'loaded' | 'exported' | 'imported' | 'cleared',
  nodeCount?: number,
  connectionCount?: number
): void => {
  const eventMap = {
    created: AnalyticsEvent.WORKFLOW_CREATED,
    saved: AnalyticsEvent.WORKFLOW_SAVED,
    loaded: AnalyticsEvent.WORKFLOW_LOADED,
    exported: AnalyticsEvent.WORKFLOW_EXPORTED,
    imported: AnalyticsEvent.WORKFLOW_IMPORTED,
    cleared: AnalyticsEvent.WORKFLOW_CLEARED,
  };

  trackEvent(eventMap[operation], {
    node_count: nodeCount,
    connection_count: connectionCount,
    timestamp: Date.now(),
  });
};

/**
 * Identify user (for authenticated sessions)
 */
export const identifyUser = (userId: string, properties?: AnalyticsProperties): void => {
  if (IS_PRODUCTION) {
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set(properties);
    }
  } else {
    console.log(`[Analytics] Identify user: ${userId}`, properties);
  }
};

/**
 * Reset analytics (on logout)
 */
export const resetAnalytics = (): void => {
  if (IS_PRODUCTION) {
    mixpanel.reset();
  } else {
    console.log('[Analytics] Reset');
  }
};
