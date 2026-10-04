import { WorkspaceFile } from '@/types/wireframe';

export const TASK_MANAGER_WORKSPACE: WorkspaceFile[] = [
  {
    path: 'docs/PRD.md',
    name: 'PRD.md',
    size: 2450,
    fileType: 'document',
    selected: true,
    hash: 'tm-hash-prd',
    content: `# TaskFlow PRD: Agile Task Management Platform

## 1. Overview & Vision
TaskFlow is a collaborative task and project tracking tool designed for modern agile software development teams. It enables engineering teams, product managers, and team leads to plan sprints, track work items, and visualize project velocity.

## 2. Target Personas
- **Developer / Contributor**: Needs clean overview of assigned tasks, quick status updates, and code commit linkages.
- **Project Manager**: Needs sprint health metrics, velocity charts, team workload distribution, and milestone tracking.
- **Admin**: Configures team members, roles, integrations, and project settings.

## 3. Core Features
- Real-time sprint dashboard with burndown chart and KPI cards.
- Interactive task list with column filters, search, and priority sorting.
- Detailed task view with subtasks, comments, activity timeline, and attachments.
- Quick create task modal with assignee picker, priority badge, and markdown description.
- Team settings and workspace configuration.

## 4. Key User Flows
1. **Create & Assign Task**: Dashboard -> Task List -> Click "+ New Task" -> Fill Modal -> Submit -> Return to Task List.
2. **Review & Update Task**: Task List -> Select Item -> Open Task Details -> Change Status to "In Progress" -> Add Comment.
3. **Sprint Health Review**: Dashboard Overview -> View Velocity Chart -> Inspect Overdue Tasks.

## 5. Screen Inventory
- **Screen: Dashboard Overview**
  - Purpose: High-level sprint statistics, velocity chart, and urgent notifications.
  - Role: Project Manager, Developer
  - Components: navbar, chart, card, list, button
- **Screen: Task List**
  - Purpose: Full backlog and sprint task table with filters, search, and bulk operations.
  - Role: Developer, Project Manager
  - Components: navbar, table, input, select, button
- **Screen: Task Details**
  - Purpose: Comprehensive view of task specifications, assignees, subtasks, and comments.
  - Role: Developer
  - Components: header, card, list, textarea, button, breadcrumb
- **Screen: Create Task Modal**
  - Purpose: Fast task entry form with inputs, select dropdowns, and date picker.
  - Role: Any
  - Components: modal, input, textarea, select, button
- **Screen: Project Settings**
  - Purpose: Manage team members, notification toggles, and workflow statuses.
  - Role: Admin
  - Components: navbar, sidebar, toggle, table, button
`
  },
  {
    path: 'package.json',
    name: 'package.json',
    size: 512,
    fileType: 'code',
    selected: true,
    hash: 'tm-hash-pkg',
    content: `{
  "name": "task-flow-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "lucide-react": "^0.300.0"
  }
}`
  },
  {
    path: 'src/app/tasks/page.tsx',
    name: 'page.tsx',
    size: 1120,
    fileType: 'view',
    selected: true,
    hash: 'tm-hash-tasks-page',
    content: `'use client';
import React, { useState } from 'react';

export default function TasksPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaskFlow</h1>
        <button className="btn btn-primary">+ Create Task</button>
      </nav>
      <main className="p-8 space-y-6">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full max-w-xs"
          />
          <select className="select select-bordered">
            <option>All Statuses</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TF-101</td>
              <td>Implement OAuth authentication</td>
              <td>In Progress</td>
              <td>Alex Smith</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}`
  },
  {
    path: 'src/app/dashboard/page.tsx',
    name: 'page.tsx',
    size: 980,
    fileType: 'view',
    selected: true,
    hash: 'tm-hash-dash-page',
    content: `import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <header className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold">Sprint Dashboard</h1>
        <button className="btn">Export Report</button>
      </header>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card p-4 border">Sprint Velocity: 42 pts</div>
        <div className="card p-4 border">Tasks Done: 18 / 24</div>
        <div className="card p-4 border">Days Remaining: 4</div>
      </div>
      <div className="chart-container border p-6">
        <h3>Sprint Burndown Chart</h3>
      </div>
    </div>
  );
}`
  }
];
