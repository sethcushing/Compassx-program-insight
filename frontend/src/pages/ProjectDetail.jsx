import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowLeft, Target, ListTodo, BookOpen, Calendar, Clock, Users,
  AlertTriangle, CheckCircle2, Circle, Play, Pause, Plus, MoreVertical,
  Sparkles, TrendingUp
} from 'lucide-react';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', estimated_hours: 8 });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`, { withCredentials: true });
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await axios.post(`${API}/tasks`, {
        project_id: projectId,
        ...newTask
      }, { withCredentials: true });
      toast.success('Task added successfully');
      setIsAddTaskOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', estimated_hours: 8 });
      loadProject();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
      loadProject();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" strokeWidth={1.5} />;
      case 'in_review': return <Pause className="w-4 h-4 text-purple-500" strokeWidth={1.5} />;
      default: return <Circle className="w-4 h-4 text-slate-400" strokeWidth={1.5} />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'on_track': return 'bg-emerald-500';
      case 'at_risk': return 'bg-amber-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-slate-500/20 text-slate-600 dark:text-slate-400',
      medium: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      high: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      critical: 'bg-red-500/20 text-red-600 dark:text-red-400'
    };
    return <Badge className={`${styles[priority] || styles.medium} font-medium`}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) return null;

  const tasksDone = project.tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="project-detail-main">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {project.ai_generated && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                    AI Generated
                  </div>
                )}
                {getPriorityBadge(project.priority)}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                {project.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{project.description}</p>
            </div>

            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button
                  className="h-11 px-6 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  data-testid="add-task-button"
                >
                  <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Title</label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Task title"
                      className="rounded-xl"
                      data-testid="new-task-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Description</label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description"
                      className="rounded-xl"
                      data-testid="new-task-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Priority</label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger className="rounded-xl" data-testid="new-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Estimated Hours</label>
                      <Input
                        type="number"
                        value={newTask.estimated_hours}
                        onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))}
                        className="rounded-xl"
                        data-testid="new-task-hours"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddTask} className="w-full rounded-full bg-indigo-600" data-testid="submit-task">
                    Add Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5" data-testid="stat-progress">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</div>
                <div className="text-sm text-slate-500">Progress</div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="glass-card p-5" data-testid="stat-tasks">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{tasksDone}/{totalTasks}</div>
                <div className="text-sm text-slate-500">Tasks Complete</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5" data-testid="stat-milestones">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.milestones?.length || 0}</div>
                <div className="text-sm text-slate-500">Milestones</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5" data-testid="stat-stories">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.stories?.length || 0}</div>
                <div className="text-sm text-slate-500">User Stories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 h-auto inline-flex gap-1">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white" data-testid="tab-tasks">
              Tasks ({totalTasks})
            </TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white" data-testid="tab-milestones">
              Milestones ({project.milestones?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white" data-testid="tab-stories">
              Stories ({project.stories?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <div className="glass-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT DETAILS</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <Badge className="bg-emerald-500/20 text-emerald-600">{project.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Start Date</span>
                    <span className="text-slate-900 dark:text-white font-medium">{project.start_date || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Date</span>
                    <span className="text-slate-900 dark:text-white font-medium">{project.target_date || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Priority</span>
                    {getPriorityBadge(project.priority)}
                  </div>
                </div>
              </div>

              {/* Phases */}
              {project.phases && project.phases.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT PHASES</h3>
                  <div className="space-y-3">
                    {project.phases.map((phase, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-white">{phase.name}</div>
                          <div className="text-sm text-slate-500">{phase.duration_weeks} weeks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {project.tasks?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No tasks yet. Add your first task!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.tasks?.map((task) => (
                  <div key={task.task_id} className="glass-card p-4 hover:shadow-lg transition-all" data-testid={`task-${task.task_id}`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.task_id, task.status === 'done' ? 'todo' : 'done')}
                        className="flex-shrink-0"
                        data-testid={`task-toggle-${task.task_id}`}
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-slate-500 truncate">{task.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(task.priority)}
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" strokeWidth={1.5} />
                          {task.estimated_hours}h
                        </div>
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleUpdateTaskStatus(task.task_id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg" data-testid={`task-status-${task.task_id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            {project.milestones?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No milestones defined.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.milestones?.map((milestone) => (
                  <div key={milestone.milestone_id} className="glass-card p-5" data-testid={`milestone-${milestone.milestone_id}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${getHealthColor(milestone.health_status)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{milestone.title}</h4>
                          <Badge className={`
                            ${milestone.health_status === 'on_track' ? 'bg-emerald-500/20 text-emerald-600' : ''}
                            ${milestone.health_status === 'at_risk' ? 'bg-amber-500/20 text-amber-600' : ''}
                            ${milestone.health_status === 'delayed' ? 'bg-red-500/20 text-red-600' : ''}
                          `}>
                            {milestone.health_status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" strokeWidth={1.5} />
                          Target: {milestone.target_date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            {project.stories?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No user stories yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.stories?.map((story) => (
                  <div key={story.story_id} className="glass-card p-5" data-testid={`story-${story.story_id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {story.epic && (
                          <Badge className="bg-purple-500/20 text-purple-600 mb-2">{story.epic}</Badge>
                        )}
                        <h4 className="font-semibold text-slate-900 dark:text-white">{story.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-500/20 text-indigo-600">{story.story_points} pts</Badge>
                        {getPriorityBadge(story.priority)}
                      </div>
                    </div>
                    {story.description && (
                      <p className="text-sm text-slate-500 mb-3">{story.description}</p>
                    )}
                    {story.acceptance_criteria?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Acceptance Criteria</div>
                        <ul className="space-y-1">
                          {story.acceptance_criteria.map((ac, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                              {ac}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectDetail;
