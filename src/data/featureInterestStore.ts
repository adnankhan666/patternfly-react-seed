export type FeaturePriority = 'must-have' | 'nice-to-have' | 'exploring' | null;

export interface FeatureInterest {
  voted: boolean;
  priority: FeaturePriority;
  selectedUseCases: string[];
  comment: string;
  submittedAt: string | null;
}

const STORAGE_KEY = 'dpFeatureInterest';

const DEFAULT_INTEREST: FeatureInterest = {
  voted: false,
  priority: null,
  selectedUseCases: [],
  comment: '',
  submittedAt: null,
};

function readStore(): Record<string, FeatureInterest> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, FeatureInterest>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, FeatureInterest>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getAllFeatureInterests(): Record<string, FeatureInterest> {
  return readStore();
}

export function getFeatureInterest(featureId: string): FeatureInterest {
  const store = readStore();
  return store[featureId] ? { ...DEFAULT_INTEREST, ...store[featureId] } : { ...DEFAULT_INTEREST };
}

export function saveFeatureInterest(featureId: string, data: FeatureInterest): void {
  const store = readStore();
  store[featureId] = data;
  writeStore(store);
}

export function hasVoted(featureId: string): boolean {
  return getFeatureInterest(featureId).voted;
}

export function getInterestCount(featureId: string, baseCount: number): number {
  const interest = getFeatureInterest(featureId);
  return baseCount + (interest.voted ? 1 : 0);
}

export function toggleVote(featureId: string): FeatureInterest {
  const current = getFeatureInterest(featureId);
  const next: FeatureInterest = {
    ...current,
    voted: !current.voted,
    submittedAt: current.voted ? current.submittedAt : current.submittedAt ?? new Date().toISOString(),
  };
  if (!next.voted && !next.priority && next.selectedUseCases.length === 0 && !next.comment) {
    next.submittedAt = null;
  }
  saveFeatureInterest(featureId, next);
  return next;
}

const STARRED_STORAGE_KEY = 'starredFeatures';
export const FEATURE_STARRED_EVENT = 'feature-starred';

function readStarredIds(): string[] {
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeStarredIds(ids: string[]): void {
  localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(FEATURE_STARRED_EVENT));
}

export function getStarredFeatureIds(): string[] {
  return readStarredIds();
}

export function isStarred(featureId: string): boolean {
  return readStarredIds().includes(featureId);
}

export function toggleStar(featureId: string): boolean {
  const ids = readStarredIds();
  const index = ids.indexOf(featureId);
  if (index >= 0) {
    ids.splice(index, 1);
    writeStarredIds(ids);
    return false;
  }
  ids.push(featureId);
  writeStarredIds(ids);
  return true;
}
