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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowLeft, Target, ListTodo, BookOpen, Calendar, Clock, AlertTriangle,
  CheckCircle2, Circle, Play, Pause, Plus, Edit2, Trash2,
  Sparkles, TrendingUp, ShieldAlert, X
} from 'lucide-react';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [isEditStoryOpen, setIsEditStoryOpen] = useState(false);
  const [isAddRiskOpen, setIsAddRiskOpen] = useState(false);
  const [isEditRiskOpen, setIsEditRiskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  
  // Form states
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', estimated_hours: 8 });
  const [editingTask, setEditingTask] = useState(null);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', target_date: '', health_status: 'on_track' });
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [newStory, setNewStory] = useState({ title: '', description: '', epic: '', priority: 'medium', story_points: 3, acceptance_criteria: [''] });
  const [editingStory, setEditingStory] = useState(null);
  const [newRisk, setNewRisk] = useState({ description: '', mitigation: '', probability: 'medium', impact: 'medium' });
  const [editingRisk, setEditingRisk] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

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

  // ============ TASK HANDLERS ============
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    try {
      await axios.post(`${API}/tasks`, { project_id: projectId, ...newTask }, { withCredentials: true });
      toast.success('Task added');
      setIsAddTaskOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', estimated_hours: 8 });
      loadProject();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask?.title?.trim()) {
      toast.error('Task title is required');
      return;
    }
    try {
      await axios.patch(`${API}/tasks/${editingTask.task_id}`, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        estimated_hours: editingTask.estimated_hours
      }, { withCredentials: true });
      toast.success('Task updated');
      setIsEditTaskOpen(false);
      setEditingTask(null);
      loadProject();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { withCredentials: true });
      toast.success('Task deleted');
      loadProject();
    } catch (error) {
      toast.error('Failed to delete task');
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

  // ============ MILESTONE HANDLERS ============
  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.target_date) {
      toast.error('Title and target date are required');
      return;
    }
    try {
      await axios.post(`${API}/milestones`, { project_id: projectId, ...newMilestone }, { withCredentials: true });
      toast.success('Milestone added');
      setIsAddMilestoneOpen(false);
      setNewMilestone({ title: '', description: '', target_date: '', health_status: 'on_track' });
      loadProject();
    } catch (error) {
      toast.error('Failed to add milestone');
    }
  };

  const handleEditMilestone = async () => {
    if (!editingMilestone?.title?.trim()) {
      toast.error('Milestone title is required');
      return;
    }
    try {
      await axios.patch(`${API}/milestones/${editingMilestone.milestone_id}`, {
        title: editingMilestone.title,
        description: editingMilestone.description,
        target_date: editingMilestone.target_date,
        health_status: editingMilestone.health_status,
        completed: editingMilestone.completed
      }, { withCredentials: true });
      toast.success('Milestone updated');
      setIsEditMilestoneOpen(false);
      setEditingMilestone(null);
      loadProject();
    } catch (error) {
      toast.error('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      await axios.delete(`${API}/milestones/${milestoneId}`, { withCredentials: true });
      toast.success('Milestone deleted');
      loadProject();
    } catch (error) {
      toast.error('Failed to delete milestone');
    }
  };

  // ============ STORY HANDLERS ============
  const handleAddStory = async () => {
    if (!newStory.title.trim()) {
      toast.error('Story title is required');
      return;
    }
    try {
      await axios.post(`${API}/stories`, { 
        project_id: projectId, 
        ...newStory,
        acceptance_criteria: newStory.acceptance_criteria.filter(ac => ac.trim())
      }, { withCredentials: true });
      toast.success('Story added');
      setIsAddStoryOpen(false);
      setNewStory({ title: '', description: '', epic: '', priority: 'medium', story_points: 3, acceptance_criteria: [''] });
      loadProject();
    } catch (error) {
      toast.error('Failed to add story');
    }
  };

  const handleEditStory = async () => {
    if (!editingStory?.title?.trim()) {
      toast.error('Story title is required');
      return;
    }
    try {
      await axios.patch(`${API}/stories/${editingStory.story_id}`, {
        title: editingStory.title,
        description: editingStory.description,
        epic: editingStory.epic,
        priority: editingStory.priority,
        story_points: editingStory.story_points,
        status: editingStory.status,
        acceptance_criteria: editingStory.acceptance_criteria?.filter(ac => ac.trim()) || []
      }, { withCredentials: true });
      toast.success('Story updated');
      setIsEditStoryOpen(false);
      setEditingStory(null);
      loadProject();
    } catch (error) {
      toast.error('Failed to update story');
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await axios.delete(`${API}/stories/${storyId}`, { withCredentials: true });
      toast.success('Story deleted');
      loadProject();
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  // ============ RISK HANDLERS ============
  const handleAddRisk = async () => {
    if (!newRisk.description.trim()) {
      toast.error('Risk description is required');
      return;
    }
    try {
      await axios.post(`${API}/risks`, { project_id: projectId, ...newRisk }, { withCredentials: true });
      toast.success('Risk added');
      setIsAddRiskOpen(false);
      setNewRisk({ description: '', mitigation: '', probability: 'medium', impact: 'medium' });
      loadProject();
    } catch (error) {
      toast.error('Failed to add risk');
    }
  };

  const handleEditRisk = async () => {
    if (!editingRisk?.description?.trim()) {
      toast.error('Risk description is required');
      return;
    }
    try {
      await axios.patch(`${API}/risks/${editingRisk.risk_id}`, {
        description: editingRisk.description,
        mitigation: editingRisk.mitigation,
        probability: editingRisk.probability,
        impact: editingRisk.impact,
        status: editingRisk.status
      }, { withCredentials: true });
      toast.success('Risk updated');
      setIsEditRiskOpen(false);
      setEditingRisk(null);
      loadProject();
    } catch (error) {
      toast.error('Failed to update risk');
    }
  };

  const handleDeleteRisk = async (riskId) => {
    try {
      await axios.delete(`${API}/risks/${riskId}`, { withCredentials: true });
      toast.success('Risk deleted');
      loadProject();
    } catch (error) {
      toast.error('Failed to delete risk');
    }
  };

  // ============ PROJECT HANDLERS ============
  const handleEditProject = async () => {
    if (!editingProject?.name?.trim()) {
      toast.error('Project name is required');
      return;
    }
    try {
      await axios.patch(`${API}/projects/${projectId}`, {
        name: editingProject.name,
        description: editingProject.description,
        status: editingProject.status,
        priority: editingProject.priority,
        start_date: editingProject.start_date,
        target_date: editingProject.target_date
      }, { withCredentials: true });
      toast.success('Project updated');
      setIsEditProjectOpen(false);
      setEditingProject(null);
      loadProject();
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await axios.delete(`${API}/projects/${projectId}`, { withCredentials: true });
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" strokeWidth={1.5} />;
      case 'in_review': return <Pause className="w-4 h-4 text-cyan-500" strokeWidth={1.5} />;
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

  const getRiskLevel = (probability, impact) => {
    const levels = { low: 1, medium: 2, high: 3 };
    const score = levels[probability] * levels[impact];
    if (score >= 6) return { label: 'Critical', color: 'bg-red-500/20 text-red-600' };
    if (score >= 4) return { label: 'High', color: 'bg-amber-500/20 text-amber-600' };
    if (score >= 2) return { label: 'Medium', color: 'bg-blue-500/20 text-blue-600' };
    return { label: 'Low', color: 'bg-slate-500/20 text-slate-600' };
  };

  const addAcceptanceCriteria = (isEditing = false) => {
    if (isEditing) {
      setEditingStory(prev => ({
        ...prev,
        acceptance_criteria: [...(prev.acceptance_criteria || []), '']
      }));
    } else {
      setNewStory(prev => ({
        ...prev,
        acceptance_criteria: [...prev.acceptance_criteria, '']
      }));
    }
  };

  const updateAcceptanceCriteria = (index, value, isEditing = false) => {
    if (isEditing) {
      setEditingStory(prev => ({
        ...prev,
        acceptance_criteria: prev.acceptance_criteria.map((ac, i) => i === index ? value : ac)
      }));
    } else {
      setNewStory(prev => ({
        ...prev,
        acceptance_criteria: prev.acceptance_criteria.map((ac, i) => i === index ? value : ac)
      }));
    }
  };

  const removeAcceptanceCriteria = (index, isEditing = false) => {
    if (isEditing) {
      setEditingStory(prev => ({
        ...prev,
        acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== index)
      }));
    } else {
      setNewStory(prev => ({
        ...prev,
        acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
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
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                    AI Generated
                  </div>
                )}
                {getPriorityBadge(project.priority)}
                <Badge className={`
                  ${project.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : ''}
                  ${project.status === 'planning' ? 'bg-slate-500/20 text-slate-600' : ''}
                  ${project.status === 'completed' ? 'bg-blue-500/20 text-blue-600' : ''}
                  ${project.status === 'on_hold' ? 'bg-amber-500/20 text-amber-600' : ''}
                `}>{project.status}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                {project.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{project.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => { setEditingProject({...project}); setIsEditProjectOpen(true); }}
                className="rounded-full"
                data-testid="edit-project-button"
              >
                <Edit2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="rounded-full text-red-500 hover:text-red-600" data-testid="delete-project-button">
                    <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the project and all associated tasks, milestones, stories, and risks. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</div>
                <div className="text-sm text-slate-500">Progress</div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{tasksDone}/{totalTasks}</div>
                <div className="text-sm text-slate-500">Tasks</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.milestones?.length || 0}</div>
                <div className="text-sm text-slate-500">Milestones</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.stories?.length || 0}</div>
                <div className="text-sm text-slate-500">Stories</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{project.risks?.length || 0}</div>
                <div className="text-sm text-slate-500">Risks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 h-auto inline-flex gap-1">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Tasks ({totalTasks})</TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Milestones ({project.milestones?.length || 0})</TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Stories ({project.stories?.length || 0})</TabsTrigger>
            <TabsTrigger value="risks" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Risks ({project.risks?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              {project.phases && project.phases.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT PHASES</h3>
                  <div className="space-y-3">
                    {project.phases.map((phase, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-sm">
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

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-task-button">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title *</label>
                      <Input value={newTask.title} onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))} placeholder="Task title" className="rounded-xl" data-testid="new-task-title" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea value={newTask.description} onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))} placeholder="Task description" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Priority</label>
                        <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Estimated Hours</label>
                        <Input type="number" value={newTask.estimated_hours} onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                      </div>
                    </div>
                    <Button onClick={handleAddTask} className="w-full rounded-full bg-blue-600">Add Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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
                      <button onClick={() => handleUpdateTaskStatus(task.task_id, task.status === 'done' ? 'todo' : 'done')} className="flex-shrink-0">
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{task.title}</div>
                        {task.description && <div className="text-sm text-slate-500 truncate">{task.description}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(task.priority)}
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" strokeWidth={1.5} />
                          {task.estimated_hours}h
                        </div>
                        <Select value={task.status} onValueChange={(value) => handleUpdateTaskStatus(task.task_id, value)}>
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTask({...task}); setIsEditTaskOpen(true); }}>
                          <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTask(task.task_id)} className="bg-red-500">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-milestone-button">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title *</label>
                      <Input value={newMilestone.title} onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))} placeholder="Milestone title" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea value={newMilestone.description} onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))} placeholder="Milestone description" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Date *</label>
                      <Input type="date" value={newMilestone.target_date} onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Health Status</label>
                      <Select value={newMilestone.health_status} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, health_status: value }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_track">On Track</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddMilestone} className="w-full rounded-full bg-blue-600">Add Milestone</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {project.milestones?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No milestones defined. Add your first milestone!</p>
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
                          <div className="flex items-center gap-2">
                            <Badge className={`
                              ${milestone.health_status === 'on_track' ? 'bg-emerald-500/20 text-emerald-600' : ''}
                              ${milestone.health_status === 'at_risk' ? 'bg-amber-500/20 text-amber-600' : ''}
                              ${milestone.health_status === 'delayed' ? 'bg-red-500/20 text-red-600' : ''}
                            `}>{milestone.health_status?.replace('_', ' ')}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingMilestone({...milestone}); setIsEditMilestoneOpen(true); }}>
                              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMilestone(milestone.milestone_id)} className="bg-red-500">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

          {/* Stories Tab */}
          <TabsContent value="stories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddStoryOpen} onOpenChange={setIsAddStoryOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-story-button">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Story</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title *</label>
                      <Input value={newStory.title} onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))} placeholder="As a [user], I want [feature] so that [benefit]" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea value={newStory.description} onChange={(e) => setNewStory(prev => ({ ...prev, description: e.target.value }))} placeholder="Story details" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Epic</label>
                      <Input value={newStory.epic} onChange={(e) => setNewStory(prev => ({ ...prev, epic: e.target.value }))} placeholder="Epic name" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Priority</label>
                        <Select value={newStory.priority} onValueChange={(value) => setNewStory(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Story Points</label>
                        <Select value={String(newStory.story_points)} onValueChange={(value) => setNewStory(prev => ({ ...prev, story_points: parseInt(value) }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5, 8, 13, 21].map(p => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Acceptance Criteria</label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => addAcceptanceCriteria(false)}>
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {newStory.acceptance_criteria.map((ac, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input value={ac} onChange={(e) => updateAcceptanceCriteria(idx, e.target.value, false)} placeholder={`Criteria ${idx + 1}`} className="rounded-xl" />
                            {newStory.acceptance_criteria.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeAcceptanceCriteria(idx, false)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddStory} className="w-full rounded-full bg-blue-600">Add Story</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {project.stories?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No user stories yet. Add your first story!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.stories?.map((story) => (
                  <div key={story.story_id} className="glass-card p-5" data-testid={`story-${story.story_id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {story.epic && <Badge className="bg-cyan-500/20 text-cyan-600 mb-2">{story.epic}</Badge>}
                        <h4 className="font-semibold text-slate-900 dark:text-white">{story.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-600">{story.story_points} pts</Badge>
                        {getPriorityBadge(story.priority)}
                        <Button variant="ghost" size="sm" onClick={() => { setEditingStory({...story, acceptance_criteria: story.acceptance_criteria || []}); setIsEditStoryOpen(true); }}>
                          <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStory(story.story_id)} className="bg-red-500">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {story.description && <p className="text-sm text-slate-500 mb-3">{story.description}</p>}
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

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddRiskOpen} onOpenChange={setIsAddRiskOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-risk-button">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Risk
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Risk</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description *</label>
                      <Textarea value={newRisk.description} onChange={(e) => setNewRisk(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the risk" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Mitigation Plan</label>
                      <Textarea value={newRisk.mitigation} onChange={(e) => setNewRisk(prev => ({ ...prev, mitigation: e.target.value }))} placeholder="How to mitigate this risk" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Probability</label>
                        <Select value={newRisk.probability} onValueChange={(value) => setNewRisk(prev => ({ ...prev, probability: value }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Impact</label>
                        <Select value={newRisk.impact} onValueChange={(value) => setNewRisk(prev => ({ ...prev, impact: value }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddRisk} className="w-full rounded-full bg-blue-600">Add Risk</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {project.risks?.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-500">No risks identified. Add risks to track potential issues!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.risks?.map((risk) => {
                  const riskLevel = getRiskLevel(risk.probability, risk.impact);
                  return (
                    <div key={risk.risk_id} className="glass-card p-5" data-testid={`risk-${risk.risk_id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${
                            riskLevel.label === 'Critical' ? 'text-red-500' :
                            riskLevel.label === 'High' ? 'text-amber-500' :
                            riskLevel.label === 'Medium' ? 'text-blue-500' : 'text-slate-500'
                          }`} strokeWidth={1.5} />
                          <Badge className={riskLevel.color}>{riskLevel.label} Risk</Badge>
                          <Badge className={risk.status === 'open' ? 'bg-red-500/20 text-red-600' : risk.status === 'mitigated' ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'}>
                            {risk.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingRisk({...risk}); setIsEditRiskOpen(true); }}>
                            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Risk?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRisk(risk.risk_id)} className="bg-red-500">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium mb-2">{risk.description}</p>
                      {risk.mitigation && (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 mt-3">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Mitigation Plan</div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{risk.mitigation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Probability: {risk.probability}</span>
                        <span>Impact: {risk.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        {/* Edit Task Dialog */}
        <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
            {editingTask && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input value={editingTask.title} onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={editingTask.description || ''} onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={editingTask.priority} onValueChange={(value) => setEditingTask(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={editingTask.status} onValueChange={(value) => setEditingTask(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Estimated Hours</label>
                  <Input type="number" value={editingTask.estimated_hours} onChange={(e) => setEditingTask(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                </div>
                <Button onClick={handleEditTask} className="w-full rounded-full bg-blue-600">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Milestone Dialog */}
        <Dialog open={isEditMilestoneOpen} onOpenChange={setIsEditMilestoneOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Milestone</DialogTitle></DialogHeader>
            {editingMilestone && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input value={editingMilestone.title} onChange={(e) => setEditingMilestone(prev => ({ ...prev, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={editingMilestone.description || ''} onChange={(e) => setEditingMilestone(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Date</label>
                  <Input type="date" value={editingMilestone.target_date} onChange={(e) => setEditingMilestone(prev => ({ ...prev, target_date: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Health Status</label>
                  <Select value={editingMilestone.health_status} onValueChange={(value) => setEditingMilestone(prev => ({ ...prev, health_status: value }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_track">On Track</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleEditMilestone} className="w-full rounded-full bg-blue-600">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Story Dialog */}
        <Dialog open={isEditStoryOpen} onOpenChange={setIsEditStoryOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Story</DialogTitle></DialogHeader>
            {editingStory && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input value={editingStory.title} onChange={(e) => setEditingStory(prev => ({ ...prev, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={editingStory.description || ''} onChange={(e) => setEditingStory(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Epic</label>
                  <Input value={editingStory.epic || ''} onChange={(e) => setEditingStory(prev => ({ ...prev, epic: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={editingStory.priority} onValueChange={(value) => setEditingStory(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Story Points</label>
                    <Select value={String(editingStory.story_points)} onValueChange={(value) => setEditingStory(prev => ({ ...prev, story_points: parseInt(value) }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 8, 13, 21].map(p => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={editingStory.status} onValueChange={(value) => setEditingStory(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Acceptance Criteria</label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addAcceptanceCriteria(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingStory.acceptance_criteria?.map((ac, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={ac} onChange={(e) => updateAcceptanceCriteria(idx, e.target.value, true)} placeholder={`Criteria ${idx + 1}`} className="rounded-xl" />
                        {editingStory.acceptance_criteria.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAcceptanceCriteria(idx, true)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleEditStory} className="w-full rounded-full bg-blue-600">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Risk Dialog */}
        <Dialog open={isEditRiskOpen} onOpenChange={setIsEditRiskOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Risk</DialogTitle></DialogHeader>
            {editingRisk && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={editingRisk.description} onChange={(e) => setEditingRisk(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Mitigation Plan</label>
                  <Textarea value={editingRisk.mitigation || ''} onChange={(e) => setEditingRisk(prev => ({ ...prev, mitigation: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Probability</label>
                    <Select value={editingRisk.probability} onValueChange={(value) => setEditingRisk(prev => ({ ...prev, probability: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Impact</label>
                    <Select value={editingRisk.impact} onValueChange={(value) => setEditingRisk(prev => ({ ...prev, impact: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={editingRisk.status} onValueChange={(value) => setEditingRisk(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="mitigated">Mitigated</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleEditRisk} className="w-full rounded-full bg-blue-600">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
            {editingProject && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input value={editingProject.name} onChange={(e) => setEditingProject(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={editingProject.description || ''} onChange={(e) => setEditingProject(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={editingProject.status} onValueChange={(value) => setEditingProject(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={editingProject.priority} onValueChange={(value) => setEditingProject(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input type="date" value={editingProject.start_date || ''} onChange={(e) => setEditingProject(prev => ({ ...prev, start_date: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Date</label>
                    <Input type="date" value={editingProject.target_date || ''} onChange={(e) => setEditingProject(prev => ({ ...prev, target_date: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <Button onClick={handleEditProject} className="w-full rounded-full bg-blue-600">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ProjectDetail;
