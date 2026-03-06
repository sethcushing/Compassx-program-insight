import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  FolderKanban, Plus, GripVertical, Circle, Play, Pause, CheckCircle2, Clock
} from 'lucide-react';

const SprintPlanner = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].project_id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId) => {
    try {
      const response = await axios.get(`${API}/tasks?project_id=${projectId}`, { withCredentials: true });
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
      setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', icon: Circle, color: 'text-slate-500' },
    { id: 'in_progress', title: 'In Progress', icon: Play, color: 'text-blue-500' },
    { id: 'in_review', title: 'In Review', icon: Pause, color: 'text-purple-500' },
    { id: 'done', title: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-500',
      medium: 'bg-blue-500',
      high: 'bg-amber-500',
      critical: 'bg-red-500'
    };
    return colors[priority] || colors.medium;
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleUpdateTaskStatus(taskId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="sprint" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading sprint board...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="sprint" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="sprint-planner-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Sprint Planner
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Drag and drop tasks to manage your sprint
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64 rounded-xl" data-testid="project-selector">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board */}
        {projects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Projects Yet</h3>
            <p className="text-slate-500 mb-6">Create a project to start planning your sprints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="kanban-board">
            {columns.map(column => {
              const columnTasks = getTasksByStatus(column.id);
              const Icon = column.icon;
              
              return (
                <div
                  key={column.id}
                  className="flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  data-testid={`column-${column.id}`}
                >
                  {/* Column Header */}
                  <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${column.color}`} strokeWidth={1.5} />
                        <span className="font-semibold text-slate-900 dark:text-white">{column.title}</span>
                      </div>
                      <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {columnTasks.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 space-y-3 min-h-[400px]">
                    {columnTasks.map(task => (
                      <div
                        key={task.task_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.task_id)}
                        className="glass-card p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group"
                        data-testid={`task-card-${task.task_id}`}
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              <span className="text-xs text-slate-400 uppercase tracking-wider">{task.priority}</span>
                            </div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2 line-clamp-2">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" strokeWidth={1.5} />
                                {task.estimated_hours}h
                              </div>
                              {task.sprint && (
                                <Badge className="bg-blue-500/10 text-blue-600 text-xs">{task.sprint}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                        <p className="text-sm text-slate-400">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SprintPlanner;
