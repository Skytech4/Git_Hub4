import { jsPDF } from 'jspdf';
import TaskController from './controllers/controller';
import { Task, Project, Status } from './models/models';

document.addEventListener('DOMContentLoaded', async () => {
  const controller = new TaskController();
  await controller.initialize();
  await loadProjects(controller);
  setupTaskForm(controller);
  setupProjectForm(controller);
  await loadTasks(controller);
});

async function loadProjects(controller: TaskController) {
  const projects = await controller.getAllProjects();
  const projectList = document.getElementById('project-list');
  const projectSelect = document.getElementById('project-select') as HTMLSelectElement;
  const projectFilter = document.getElementById('project-filter') as HTMLSelectElement;

  if (projectList && projectSelect && projectFilter) {
    projectList.innerHTML = '';
    projectSelect.innerHTML = '<option value="">No Project</option>';
    projectFilter.innerHTML = '<option value="">All Projects</option>';

    projects.forEach(project => {
      projectList.innerHTML += `<li><span>${project.name}</span> <button data-id="${project.id}" class="delete-project">Delete</button></li>`;
      projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
      projectFilter.innerHTML += `<option value="${project.id}">${project.name}</option>`;
    });
  }
}

function setupTaskForm(controller: TaskController) {
  const taskForm = document.getElementById('task-form') as HTMLFormElement;
  if (taskForm) {
    taskForm.onsubmit = async (event) => {
      event.preventDefault();
      const description = (document.getElementById('task-input') as HTMLInputElement).value;
      const plannedEndDate = new Date((document.getElementById('planned-end-date') as HTMLInputElement).value);
      const plannedEndTime = (document.getElementById('planned-end-time') as HTMLInputElement).value;
      const projectId = (document.getElementById('project-select') as HTMLSelectElement).value || '';

      if (plannedEndTime) {
        const [hours, minutes] = plannedEndTime.split(':').map(Number);
        plannedEndDate.setHours(hours, minutes);
      }

      await controller.createTask(description, plannedEndDate, projectId);
      await loadTasks(controller);
      taskForm.reset();
    };
  }
}

function setupProjectForm(controller: TaskController) {
  const projectForm = document.getElementById('project-form') as HTMLFormElement;
  if (projectForm) {
    projectForm.onsubmit = async (event) => {
      event.preventDefault();
      const name = (document.getElementById('project-input') as HTMLInputElement).value.trim().toLowerCase();
      const projects = await controller.getAllProjects();
      if (projects.some(p => p.name.toLowerCase() === name)) {
        alert('A project with this name already exists.');
        return;
      }
      await controller.addProject(name);
      await loadProjects(controller);
      projectForm.reset();
    };
  }
}

async function loadTasks(controller: TaskController) {
  const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement).value as Status;
  const projectFilter = (document.getElementById('project-filter') as HTMLSelectElement).value;
  const tasks = await controller.getTasksByStatusAndProject(statusFilter, projectFilter);
  const taskList = document.getElementById('todo-list');

  if (taskList) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      taskList.innerHTML += `<li class="${task.status === Status.Completed ? 'completed' : ''}">
        <span>${task.description}</span>
        <span>Start: ${task.startDate}</span>
        <span>Planned End: ${task.plannedEndDate}</span>
        ${task.actualEndDate ? `<span>Actual End: ${task.actualEndDate}</span>` : ''}
        ${task.actualDuration !== null ? `<span>Duration: ${task.actualDuration}s</span>` : ''}
        <span>Status: ${task.status}</span>
        <div class="actions">
          <button data-id="${task.id}" class="start-task">Start</button>
          <button data-id="${task.id}" class="complete-task">Complete</button>
          <button data-id="${task.id}" class="edit-task">Edit</button>
          <button data-id="${task.id}" class="delete-task">Delete</button>
          <button data-id="${task.id}" class="get-resources">Resources</button>
        </div>
      </li>`;
    });
  }
}
