export interface Task {
  id: number;
  name: string;
  solution?: string; // 👈 جديد
  image?: string; // 👈 جديد (base64)

  done: boolean;
  startDate: string;
  dueDate: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
}
