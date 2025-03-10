import { Task, Project, Status } from '../models/models';

export default class Database {
  private dbName: string = 'TodoApp';
  private version: number = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (evt) => {
        const db = (evt.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };

      request.onsuccess = (evt) => {
        this.db = (evt.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async addTask(task: Task): Promise<void> {
    return this.performWriteOperation('tasks', 'add', task);
  }

  async deleteTask(id: number): Promise<void> {
    return this.performWriteOperation('tasks', 'delete', id);
  }

  async updateTask(task: Task): Promise<void> {
    return this.performWriteOperation('tasks', 'put', task);
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.performReadOperation('tasks', 'get', id);
  }

  async getTasksByStatusAndProject(status?: Status, projectId?: string): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const tasks: Task[] = [];

      store.openCursor().onsuccess = (evt) => {
        const cursor = (evt.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const task = cursor.value as Task;
          if ((!status || task.status === status) && (!projectId || task.projectId === projectId)) {
            tasks.push(task);
          }
          cursor.continue();
        } else {
          resolve(tasks);
        }
      };

      store.openCursor().onerror = (evt) => reject((evt.target as IDBRequest).error);
    });
  }

  async addProject(project: Project): Promise<void> {
    return this.performWriteOperation('projects', 'add', project);
  }

  async deleteProject(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      const transaction = this.db.transaction(['projects', 'tasks'], 'readwrite');
      const projectStore = transaction.objectStore('projects');
      const taskStore = transaction.objectStore('tasks');

      const deleteProjectRequest = projectStore.delete(id);
      const cursorRequest = taskStore.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const task = cursor.value as Task;
          if (task.projectId === id) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      deleteProjectRequest.onsuccess = () => {
        transaction.oncomplete = () => resolve();
      };

      deleteProjectRequest.onerror = (evt) => reject((evt.target as IDBRequest).error);
      cursorRequest.onerror = (evt) => reject((evt.target as IDBRequest).error);
    });
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.performReadOperation('projects', 'get', id);
  }

  async getAllProjects(): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const projects: Project[] = [];

      store.openCursor().onsuccess = (evt) => {
        const cursor = (evt.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          projects.push(cursor.value as Project);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      store.openCursor().onerror = (evt) => reject((evt.target as IDBRequest).error);
    });
  }

  private async performWriteOperation(storeName: string, operation: 'add' | 'put' | 'delete', data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store[operation](data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async performReadOperation<T>(storeName: string, operation: 'get', key: any): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store[operation](key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }
}
