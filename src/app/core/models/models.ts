export type UserRole = 'admin' | 'manager' | 'collaborator';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  avatar: string;
  active: boolean;
  createdAt: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  budget?: string;
  color: string;
  createdAt: string;
}

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  dueDate: string;
  tags?: string[];
}

export type NotificationType = 'new_task' | 'status_change' | 'deadline_alert' | 'task_completed';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  targetName: string;
  targetType: 'task' | 'project' | 'user' | 'comment';
  timestamp: string;
}

export interface TaskFilter {
  search: string;
  status: string;
  priority: string;
  assigneeId: string;
  projectId: string;
  dateFrom: string;
  dateTo: string;
}

