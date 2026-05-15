import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Task, TaskModel } from '../../services/task';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-e-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './e-tasks.html',
  styleUrl: './e-tasks.css',
})
export class ETasks implements OnInit, OnDestroy {
  taskName = '';
  taskStartDate = '';
  taskStatus: TaskModel['status'] = 'New';
  taskPriority: TaskModel['priority'] = 'Medium';
  taskSolution = '';
  taskPath = '';

  taskSearchName = '';
  taskSearchDate = '';

  tasks = signal<TaskModel[]>([]);
  selectedTasks = signal<(string | number)[]>([]);
  editingTask = signal<TaskModel | null>(null);

  editingStartDateValue = '';
  editingDueDateValue = '';
  editingSolution = '';
  editingPath = '';

  savedMessage = signal<string>('');
  lastUpdateTime = '';
  isLoading = false;

  statusOptions: TaskModel['status'][] = ['New', 'In Progress', 'Completed', 'Delayed'];
  priorityOptions: TaskModel['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

  private destroy$ = new Subject<void>();

  constructor(private service: Task) {}

  ngOnInit() {
    this.service
      .getAll$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.updateLastSavedTime();
        },
        error: (err) => console.error(err),
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateLastSavedTime() {
    const lastUpdate = this.service.getLastUpdateTime();
    this.lastUpdateTime = lastUpdate !== 'Never' ? lastUpdate : 'No saved tasks yet';
  }

  showSaveMessage(message = '✓ Data saved successfully') {
    this.savedMessage.set(message);
    setTimeout(() => this.savedMessage.set(''), 2000);
  }

  addTask() {
    if (!this.taskName.trim()) return;

    this.isLoading = true;

    const newTask: Partial<TaskModel> = {
      name: this.taskName,
      solution: this.taskSolution || '',
      path: this.taskPath || '',
      done: false,
      startDate: this.taskStartDate || new Date().toISOString(),
      status: this.taskStatus,
      priority: this.taskPriority,
    };

    this.service.save(newTask).subscribe({
      next: () => {
        this.resetForm();
        this.showSaveMessage('✓ Task added successfully');
        this.isLoading = false;
      },
      error: () => {
        this.showSaveMessage('✗ Failed to add task');
        this.isLoading = false;
      },
    });
  }

  resetForm() {
    this.taskName = '';
    this.taskStartDate = '';
    this.taskStatus = 'New';
    this.taskPriority = 'Medium';
    this.taskSolution = '';
    this.taskPath = '';
  }

  editTask(task: TaskModel) {
    this.editingTask.set({ ...task });

    this.editingStartDateValue = task.startDate ? this.toDateInput(task.startDate) : '';
    this.editingDueDateValue = task.dueDate ? this.toDateInput(task.dueDate) : '';

    this.editingSolution = task.solution || '';
    this.editingPath = task.path || task.image || '';
  }

  saveEdit() {
    const task = this.editingTask();
    if (!task) return;

    const hadDueDate = !!task.dueDate;
    const newDueDate = this.editingDueDateValue
      ? new Date(this.editingDueDateValue).toISOString()
      : '';

    task.startDate = this.editingStartDateValue
      ? new Date(this.editingStartDateValue).toISOString()
      : task.startDate;

    task.dueDate = newDueDate;

    task.solution = this.editingSolution;
    task.path = this.editingPath;

    if (hadDueDate && !newDueDate && task.status === 'Completed') {
      task.status = 'New';
    } else if (!hadDueDate && newDueDate && task.status !== 'Completed') {
      task.status = 'Completed';
    }

    this.service.update(task).subscribe({
      next: () => {
        this.editingTask.set(null);
        this.showSaveMessage('✓ Task updated successfully');
      },
      error: () => {
        this.showSaveMessage('✗ Failed to update task');
      },
    });
  }

  cancelEdit() {
    this.editingTask.set(null);
  }

  deleteTask(id: string | number) {
    this.service.delete(id as number).subscribe(() => {
      this.selectedTasks.update((tasks) => tasks.filter((t) => t !== id));
      this.showSaveMessage('✓ Task deleted successfully');
    });
  }

  toggleTaskSelection(taskId: string | number) {
    const current = this.selectedTasks();
    this.selectedTasks.set(
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  selectAllTasks() {
    const tasks = this.tasks();
    this.selectedTasks.set(
      this.selectedTasks().length === tasks.length ? [] : tasks.map((t) => t.id),
    );
  }

  deleteSelectedTasks() {
    const selected = this.selectedTasks();
    if (!selected.length) return;

    this.service.deleteMultiple(selected as number[]).subscribe(() => {
      this.selectedTasks.set([]);
      this.showSaveMessage('✓ Tasks deleted');
    });
  }

  // 🔥 Export Excel
  exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    worksheet.columns = [
      { header: 'Task', key: 'name', width: 25 },
      { header: 'Solution', key: 'solution', width: 35 },
      { header: 'Path', key: 'path', width: 40 },
      { header: 'Start Date', key: 'startDate', width: 20 },
      { header: 'End Date', key: 'dueDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Done', key: 'done', width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true };

    this.tasks().forEach((task) => {
      worksheet.addRow({
        name: task.name,
        solution: task.solution || '',
        path: task.path || task.image || '',
        startDate: this.toDisplayDateTime(task.startDate),
        dueDate: this.toDisplayDateTime(task.dueDate),
        status: task.status,
        priority: task.priority,
        done: task.done ? 'Yes' : 'No',
      });
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, 'Tasks.xlsx');
    });
  }

  getStatusClass(status: TaskModel['status']): string {
    switch (status) {
      case 'New':
        return 'status-new';
      case 'In Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      case 'Delayed':
        return 'status-delayed';
      default:
        return '';
    }
  }

  getPriorityClass(priority: TaskModel['priority']): string {
    switch (priority) {
      case 'Low':
        return 'priority-low';
      case 'Medium':
        return 'priority-medium';
      case 'High':
        return 'priority-high';
      case 'Critical':
        return 'priority-critical';
      default:
        return '';
    }
  }

  get filteredTasks(): TaskModel[] {
    return this.tasks().filter((task) => {
      const matchName = this.taskSearchName
        ? task.name.toLowerCase().includes(this.taskSearchName.toLowerCase())
        : true;

      return matchName;
    });
  }

  isTaskSelectable(task: TaskModel): boolean {
    return !!task.dueDate;
  }

  clearTaskSearch() {
    this.taskSearchName = '';
    this.taskSearchDate = '';
  }

  toDisplayDateTime(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  }

  toggleTaskDone(task: TaskModel, done: boolean) {
    if (task.dueDate) return;

    const updatedTask: TaskModel = {
      ...task,
      done,
      dueDate: done ? new Date().toISOString() : '',
      status: done ? 'Completed' : task.status,
      updatedAt: new Date().toISOString(),
    };

    this.service.update(updatedTask).subscribe({
      next: () => this.showSaveMessage('✓ Task updated'),
      error: () => this.showSaveMessage('✗ Failed to update task'),
    });
  }

  private toDateInput(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  }
}
