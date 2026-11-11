import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { TaskflowStoreService } from './core/services/taskflow-store.service';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { KanbanComponent } from './features/kanban/kanban.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ReportsComponent } from './features/reports/reports.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { UsersComponent } from './features/users/users.component';

describe('TaskFlow Enterprise — Verificação Completa de Módulos e Bugs de QA', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('deve inicializar o app e carregar os dados iniciais (3 usuários, 5 projetos, 27 tarefas)', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();

    const store = TestBed.inject(TaskflowStoreService);
    expect(store.getUsersSnapshot().length).toBe(3);
    expect(store.getProjectsSnapshot().length).toBe(5);
    expect(store.getTasksSnapshot().length).toBe(27);
  });

  it('deve validar BUG-01 (tarefa sem título) e BUG-02 (data de entrega anterior à criação)', () => {
    const store = TestBed.inject(TaskflowStoreService);
    const created = store.addTask({
      title: '',
      description: 'Tarefa sem título e com data retroativa',
      projectId: 'prj-1',
      assigneeId: 'usr-3',
      priority: 'alta',
      status: 'todo',
      createdAt: '2026-11-11',
      dueDate: '2024-01-01',
    });

    expect(created.title).toBe('');
    expect(created.dueDate < created.createdAt).toBe(true);
  });

  it('deve validar BUG-03 (exclusão de projeto não remove o projeto da lista)', () => {
    const store = TestBed.inject(TaskflowStoreService);
    const initialCount = store.getProjectsSnapshot().length;
    store.deleteProject('prj-1');
    expect(store.getProjectsSnapshot().length).toBe(initialCount);
  });

  it('deve validar BUG-04 (contador de pendentes no Dashboard considera apenas status todo)', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const allNonDone = comp.tasks.filter((t) => t.status !== 'done').length;
    expect(comp.pendingTasksCount).toBeLessThan(allNonDone);
  });

  it('deve validar BUG-05 (filtro de prioridade Alta e Crítica invertidos), BUG-10 (busca truncada) e BUG-17 (data limite exclusiva)', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    // BUG-05: Filtrar por 'alta' retorna tarefas 'critica'
    comp.filters.priority = 'alta';
    expect(comp.filteredTasks.every((t) => t.priority === 'critica')).toBe(true);
    comp.clearFilters();

    // BUG-10: Busca ignora caracteres após o 5º e é case-sensitive
    comp.filters.search = 'ImpleTEXTO_IGNORADO_999';
    expect(comp.filteredTasks.length).toBeGreaterThan(0);
    comp.clearFilters();

    // BUG-17: Filtro dateTo usa '<' em vez de '<='
    comp.filters.dateTo = '2026-11-02';
    const hasExactEndDate = comp.filteredTasks.some((t) => t.dueDate === '2026-11-02');
    expect(hasExactEndDate).toBe(false);
  });

  it('deve validar BUG-06 (edição de usuário não persiste no localStorage) e BUG-18 (permite e-mail duplicado)', () => {
    const store = TestBed.inject(TaskflowStoreService);
    store.updateUser('usr-3', { jobTitle: 'Cargo Temporário' });

    const savedInStorage = JSON.parse(localStorage.getItem('taskflow_users_v1') || '[]');
    const userInStorage = savedInStorage.find((u: { id: string }) => u.id === 'usr-3');
    expect(userInStorage.jobTitle).not.toBe('Cargo Temporário');

    // BUG-18: Permite cadastrar e-mail duplicado
    store.addUser({
      name: 'Duplicado',
      email: 'admin@taskflow.io',
      jobTitle: 'QA',
      department: 'Engenharia',
      role: 'collaborator',
      active: true,
    });
    const adminsWithSameEmail = store
      .getUsersSnapshot()
      .filter((u) => u.email === 'admin@taskflow.io');
    expect(adminsWithSameEmail.length).toBe(2);
  });

  it('deve validar BUG-08 (Kanban atualiza em memória mas não persiste no localStorage)', () => {
    const store = TestBed.inject(TaskflowStoreService);
    store.updateTaskStatusFromKanban('tsk-104', 'done');

    const inMemory = store.getTasksSnapshot().find((t) => t.id === 'tsk-104');
    const inStorage = JSON.parse(localStorage.getItem('taskflow_tasks_v1') || '[]').find(
      (t: { id: string }) => t.id === 'tsk-104'
    );

    expect(inMemory?.status).toBe('done');
    expect(inStorage?.status).toBe('todo');
  });

  it('deve validar BUG-09 (Relatórios somam in_review como tarefas concluídas)', () => {
    const fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const realDone = comp.tasks.filter((t) => t.status === 'done').length;
    expect(comp.reportedCompletedCount).toBeGreaterThan(realDone);
  });

  it('deve validar BUG-13 (Comentários exibem histórico de outras tarefas do mesmo projeto)', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const taskWithoutOwnComments = comp.tasks.find((t) => t.id === 'tsk-104')!;
    comp.openDetailDrawer(taskWithoutOwnComments);
    expect(comp.taskComments.length).toBeGreaterThan(0);
  });

  it('deve validar BUG-15 (mensagens técnicas cruas na autenticação) e BUG-16 (badge de notificações não zera)', () => {
    const auth = TestBed.inject(AuthService);
    const store = TestBed.inject(TaskflowStoreService);

    const badLogin = auth.login('naoexiste@taskflow.io', '123');
    expect(badLogin.error).toContain('ERR_AUTH_0x004F');

    const badRecover = auth.recoverPassword('invalido@taskflow.io');
    expect(badRecover.message).toContain('TypeError');

    store.markAllNotificationsAsRead();
    let badgeCount = 0;
    store.unreadCount$.subscribe((c) => (badgeCount = c));
    expect(badgeCount).toBeGreaterThan(0);
  });

  it('deve instanciar corretamente todos os demais componentes de página (Projetos, Kanban, Usuários, Notificações)', () => {
    expect(TestBed.createComponent(ProjectsComponent).componentInstance).toBeTruthy();
    expect(TestBed.createComponent(KanbanComponent).componentInstance).toBeTruthy();
    expect(TestBed.createComponent(UsersComponent).componentInstance).toBeTruthy();
    expect(TestBed.createComponent(NotificationsComponent).componentInstance).toBeTruthy();
  });
});
