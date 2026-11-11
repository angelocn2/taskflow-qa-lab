import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ActivityLog,
  AppNotification,
  Project,
  TaskComment,
  TaskItem,
  TaskStatus,
  User,
} from '../models/models';
import {
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_USERS,
} from '../data/seed-data';

const STORAGE_KEYS = {
  USERS: 'taskflow_users_v1',
  PROJECTS: 'taskflow_projects_v1',
  TASKS: 'taskflow_tasks_v1',
  COMMENTS: 'taskflow_comments_v1',
  NOTIFICATIONS: 'taskflow_notifications_v1',
  ACTIVITIES: 'taskflow_activities_v1',
};

@Injectable({
  providedIn: 'root',
})
export class TaskflowStoreService {
  private usersSubject = new BehaviorSubject<User[]>(this.loadUsers());
  private projectsSubject = new BehaviorSubject<Project[]>(this.loadProjects());
  private tasksSubject = new BehaviorSubject<TaskItem[]>(this.loadTasks());
  private commentsSubject = new BehaviorSubject<TaskComment[]>(this.loadComments());
  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.loadNotifications());
  private activitiesSubject = new BehaviorSubject<ActivityLog[]>(this.loadActivities());

  // Separate badge counter subject used by header bell
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public users$ = this.usersSubject.asObservable();
  public projects$ = this.projectsSubject.asObservable();
  public tasks$ = this.tasksSubject.asObservable();
  public comments$ = this.commentsSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public activities$ = this.activitiesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.recalculateUnreadCount();
  }

  private loadUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return [...INITIAL_USERS];
  }

  private loadProjects(): Project[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    return [...INITIAL_PROJECTS];
  }

  private loadTasks(): TaskItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    return [...INITIAL_TASKS];
  }

  private loadComments(): TaskComment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    return [...INITIAL_COMMENTS];
  }

  private loadNotifications(): AppNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    return [...INITIAL_NOTIFICATIONS];
  }

  private loadActivities(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    return [...INITIAL_ACTIVITIES];
  }

  private recalculateUnreadCount(): void {
    const unread = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(unread);
  }

  getUsersSnapshot(): User[] {
    return this.usersSubject.value;
  }

  getProjectsSnapshot(): Project[] {
    return this.projectsSubject.value;
  }

  getTasksSnapshot(): TaskItem[] {
    return this.tasksSubject.value;
  }

  getCommentsSnapshot(): TaskComment[] {
    return this.commentsSubject.value;
  }

  // ================= PROJECTS =================

  addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...projectData,
      id: 'prj-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newProject, ...this.projectsSubject.value];
    this.projectsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    this.logActivity('usr-1', 'criou o projeto', newProject.name, 'project');
    return newProject;
  }

  updateProject(id: string, changes: Partial<Project>): void {
    const updated = this.projectsSubject.value.map((p) =>
      p.id === id ? { ...p, ...changes } : p
    );
    this.projectsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
  }

  deleteProject(id: string): void {
    const current = this.projectsSubject.value;
    current.filter((p) => p.id !== id);
    this.projectsSubject.next([...current]);
  }

  // ================= TASKS =================

  addTask(taskData: Omit<TaskItem, 'id' | 'code'>): TaskItem {
    const nextNum = 101 + this.tasksSubject.value.length + Math.floor(Math.random() * 10);
    const newTask: TaskItem = {
      ...taskData,
      id: 'tsk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      code: `TF-${nextNum}`,
    };
    const updated = [newTask, ...this.tasksSubject.value];
    this.tasksSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));

    this.addNotification({
      type: 'new_task',
      title: `Nova tarefa criada: ${newTask.code}`,
      message: `A tarefa "${newTask.title || '(Sem título)'}" foi registrada no sistema.`,
      taskId: newTask.id,
      projectId: newTask.projectId,
    });

    this.logActivity(
      newTask.assigneeId || 'usr-1',
      'cadastrou a tarefa',
      `${newTask.code} · ${newTask.title || 'Sem título'}`,
      'task'
    );
    return newTask;
  }

  updateTask(id: string, changes: Partial<TaskItem>): void {
    const updated = this.tasksSubject.value.map((t) =>
      t.id === id ? { ...t, ...changes } : t
    );
    this.tasksSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));

    const target = updated.find((t) => t.id === id);
    if (target && changes.status) {
      const notifType = changes.status === 'done' ? 'task_completed' : 'status_change';
      this.addNotification({
        type: notifType,
        title:
          changes.status === 'done'
            ? `Tarefa concluída: ${target.code}`
            : `Status atualizado: ${target.code}`,
        message: `A tarefa "${target.title}" teve seu status alterado.`,
        taskId: target.id,
        projectId: target.projectId,
      });
    }
  }

  updateTaskStatusFromKanban(id: string, status: TaskStatus): void {
    const updated = this.tasksSubject.value.map((t) =>
      t.id === id ? { ...t, status } : t
    );
    this.tasksSubject.next(updated);
  }

  deleteTask(id: string): void {
    const updated = this.tasksSubject.value.filter((t) => t.id !== id);
    this.tasksSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  }

  // ================= USERS =================

  addUser(userData: Omit<User, 'id' | 'createdAt' | 'avatar'>): User {
    const initials = userData.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || 'U')
      .join('');

    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
      avatar: initials || 'US',
      createdAt: new Date().toISOString(),
    };
    const updated = [...this.usersSubject.value, newUser];
    this.usersSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return newUser;
  }

  updateUser(id: string, changes: Partial<User>): void {
    const updated = this.usersSubject.value.map((u) => {
      if (u.id === id) {
        const merged = { ...u, ...changes };
        if (changes.name) {
          merged.avatar = changes.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() || 'U')
            .join('');
        }
        return merged;
      }
      return u;
    });
    this.usersSubject.next(updated);
  }

  toggleUserActive(id: string): void {
    const updated = this.usersSubject.value.map((u) =>
      u.id === id ? { ...u, active: !u.active } : u
    );
    this.usersSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  }

  // ================= COMMENTS =================

  addComment(taskId: string, authorId: string, content: string): TaskComment {
    const newComment: TaskComment = {
      id: 'cmt-' + Date.now(),
      taskId,
      authorId,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = [...this.commentsSubject.value, newComment];
    this.commentsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    return newComment;
  }

  deleteComment(commentId: string): void {
    const updated = this.commentsSubject.value.filter((c) => c.id !== commentId);
    this.commentsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
  }

  // ================= NOTIFICATIONS =================

  addNotification(
    data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
  ): void {
    const newNotif: AppNotification = {
      ...data,
      id: 'notif-' + Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...this.notificationsSubject.value];
    this.notificationsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    this.recalculateUnreadCount();
  }

  markNotificationAsRead(id: string): void {
    const updated = this.notificationsSubject.value.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    this.recalculateUnreadCount();
  }

  markAllNotificationsAsRead(): void {
    const updated = this.notificationsSubject.value.map((n) => ({
      ...n,
      read: true,
    }));
    this.notificationsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  }

  deleteNotification(id: string): void {
    const updated = this.notificationsSubject.value.filter((n) => n.id !== id);
    this.notificationsSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    this.recalculateUnreadCount();
  }

  // ================= ACTIVITIES & RESET =================

  logActivity(
    userId: string,
    action: string,
    targetName: string,
    targetType: 'task' | 'project' | 'user' | 'comment'
  ): void {
    const entry: ActivityLog = {
      id: 'act-' + Date.now(),
      userId,
      action,
      targetName,
      targetType,
      timestamp: 'Agora mesmo',
    };
    const updated = [entry, ...this.activitiesSubject.value.slice(0, 14)];
    this.activitiesSubject.next(updated);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
  }

  resetDemoEnvironment(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));

    this.usersSubject.next([...INITIAL_USERS]);
    this.projectsSubject.next([...INITIAL_PROJECTS]);
    this.tasksSubject.next([...INITIAL_TASKS]);
    this.commentsSubject.next([...INITIAL_COMMENTS]);
    this.notificationsSubject.next([...INITIAL_NOTIFICATIONS]);
    this.activitiesSubject.next([...INITIAL_ACTIVITIES]);
    this.recalculateUnreadCount();
  }
}

