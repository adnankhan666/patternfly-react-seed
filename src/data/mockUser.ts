/**
 * Mock data factory for Users and Authentication
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  projects?: string[]; // Project IDs
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
}

type MockUserType = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  role?: UserRole;
  avatar?: string;
  projects?: string[];
  preferences?: UserPreferences;
};

/**
 * Factory function to create mock User instances
 */
export const mockUser = ({
  id = 'user-1',
  username = 'testuser',
  email = 'testuser@example.com',
  displayName = 'Test User',
  role = UserRole.EDITOR,
  avatar,
  projects = [],
  preferences = {},
}: MockUserType = {}): User => ({
  id,
  username,
  email,
  displayName,
  role,
  avatar,
  createdAt: '2024-01-15T10:00:00Z',
  lastLogin: new Date().toISOString(),
  projects,
  preferences: {
    theme: 'light',
    emailNotifications: true,
    language: 'en',
    timezone: 'UTC',
    ...preferences,
  },
});

/**
 * Collection of pre-configured mock users
 */
export const MOCK_USERS = {
  admin: mockUser({
    id: 'user-admin',
    username: 'admin',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: UserRole.ADMIN,
    projects: ['project-1', 'project-2', 'project-3'],
  }),

  editor: mockUser({
    id: 'user-editor',
    username: 'editor',
    email: 'editor@example.com',
    displayName: 'Editor User',
    role: UserRole.EDITOR,
    projects: ['project-1', 'project-2'],
  }),

  viewer: mockUser({
    id: 'user-viewer',
    username: 'viewer',
    email: 'viewer@example.com',
    displayName: 'Viewer User',
    role: UserRole.VIEWER,
    projects: ['project-1'],
  }),

  dataScientist: mockUser({
    id: 'user-ds',
    username: 'datascientist',
    email: 'ds@example.com',
    displayName: 'Data Scientist',
    role: UserRole.EDITOR,
    projects: ['project-active', 'project-experimental'],
    preferences: {
      theme: 'dark',
      emailNotifications: true,
    },
  }),

  mlEngineer: mockUser({
    id: 'user-mle',
    username: 'mlengineer',
    email: 'mle@example.com',
    displayName: 'ML Engineer',
    role: UserRole.EDITOR,
    projects: ['project-serving', 'project-data'],
    preferences: {
      theme: 'dark',
      emailNotifications: false,
    },
  }),
};

/**
 * Mock authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export const mockAuthResponse = (user: User = MOCK_USERS.editor): AuthResponse => ({
  user,
  token: 'mock-jwt-token-' + Math.random().toString(36).substring(7),
  expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
});

/**
 * Mock user list response
 */
export const mockUsersList = (users: User[] = Object.values(MOCK_USERS)) => ({
  items: users,
  total: users.length,
  page: 1,
  pageSize: 10,
});
