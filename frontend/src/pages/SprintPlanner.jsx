import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  FolderKanban, Plus, GripVertical, Circle, Play, Pause, CheckCircle2, Clock,
  BookOpen, Calendar, Users, Edit2, Target
} from 'lucide-react';

const SprintPlanner = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState('all');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddSprintOpen, setIsAddSprintOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', start_date: '', end_date: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
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

  const loadProjectData = async (projectId) => {
    try {
      const [sprintsRes, storiesRes] = await Promise.all([
        axios.get(`${API}/sprints?project_id=${projectId}`, { withCredentials: true }),
        axios.get(`${API}/stories?project_id=${projectId}`, { withCredentials: true })
      ]);
      setSprints(sprintsRes.data);
      setStories(storiesRes.data);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const handleAddSprint = async () => {
    if (!newSprint.name.trim()) {
      toast.error('Sprint name is required');
      return;
    }
    try {
      await axios.post(`${API}/sprints`, {
        project_id: selectedProject,
        ...newSprint
      }, { withCredentials: true });
      toast.success('Sprint created');
      setIsAddSprintOpen(false);
      setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
      loadProjectData(selectedProject);
    } catch (error) {
      toast.error('Failed to create sprint');
    }
  };

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      await axios.patch(`${API}/stories/${storyId}`, { status: newStatus }, { withCredentials: true });
      setStories(prev => prev.map(s => s.story_id === storyId ? { ...s, status: newStatus } : s));
      toast.success('Story updated');
    } catch (error) {
      toast.error('Failed to update story');
    }
  };

  const handleAssignToSprint = async (storyId, sprintId) => {
    try {
      await axios.patch(`${API}/stories/${storyId}`, { sprint_id: sprintId || null }, { withCredentials: true });
      setStories(prev => prev.map(s => s.story_id === storyId ? { ...s, sprint_id: sprintId } : s));
      toast.success('Story assigned to sprint');
    } catch (error) {
      toast.error('Failed to assign story');
    }
  };

  const columns = [
    { id: 'backlog', title: 'Backlog', icon: Circle, color: 'text-slate-500' },
    { id: 'ready', title: 'Ready', icon: Target, color: 'text-cyan-500' },
    { id: 'in_progress', title: 'In Progress', icon: Play, color: 'text-blue-500' },
    { id: 'in_review', title: 'In Review', icon: Pause, color: 'text-amber-500' },
    { id: 'done', title: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  const getStoriesByStatus = (status) => {
    let filtered = stories.filter(s => s.status === status);
    if (selectedSprint !== 'all') {
      filtered = filtered.filter(s => s.sprint_id === selectedSprint);
    }
    return filtered;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-500',
      medium: 'bg-blue-500',
      high: 'bg-amber-500',
      critical: 'bg-red-500'
    };
    return colors[priority] || colors.medium;
  };

  const handleDragStart = (e, storyId) => {
    e.dataTransfer.setData('storyId', storyId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const storyId = e.dataTransfer.getData('storyId');
    if (storyId) {
      handleUpdateStoryStatus(storyId, newStatus);
    }
  };

  // Calculate sprint stats
  const getSprintStats = (sprintId) => {
    const sprintStories = stories.filter(s => s.sprint_id === sprintId);
    const totalPoints = sprintStories.reduce((acc, s) => acc + (s.story_points || 0), 0);
    const completedPoints = sprintStories.filter(s => s.status === 'done').reduce((acc, s) => acc + (s.story_points || 0), 0);
    return { total: sprintStories.length, completed: sprintStories.filter(s => s.status === 'done').length, totalPoints, completedPoints };
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Sprint Board
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Drag and drop stories to manage your sprint
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-56 rounded-xl" data-testid="project-selector">
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

            <Dialog open={isAddSprintOpen} onOpenChange={setIsAddSprintOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-sprint-button">
                  <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  New Sprint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Sprint</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sprint Name *</label>
                    <Input
                      value={newSprint.name}
                      onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sprint 5"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sprint Goal</label>
                    <Textarea
                      value={newSprint.goal}
                      onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                      placeholder="What do we want to achieve?"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={newSprint.start_date}
                        onChange={(e) => setNewSprint(prev => ({ ...prev, start_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        type="date"
                        value={newSprint.end_date}
                        onChange={(e) => setNewSprint(prev => ({ ...prev, end_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddSprint} className="w-full rounded-full bg-blue-600">
                    Create Sprint
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sprint Selector */}
        {sprints.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-4 overflow-x-auto">
              <button
                onClick={() => setSelectedSprint('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedSprint === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
                data-testid="sprint-filter-all"
              >
                All Stories
              </button>
              {sprints.map(sprint => {
                const stats = getSprintStats(sprint.sprint_id);
                return (
                  <button
                    key={sprint.sprint_id}
                    onClick={() => setSelectedSprint(sprint.sprint_id)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                      selectedSprint === sprint.sprint_id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                    data-testid={`sprint-filter-${sprint.sprint_id}`}
                  >
                    {sprint.name}
                    <Badge className={`${selectedSprint === sprint.sprint_id ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600'}`}>
                      {stats.completedPoints}/{stats.totalPoints} pts
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {projects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Projects Yet</h3>
            <p className="text-slate-500 mb-6">Create a project to start planning your sprints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kanban-board">
            {columns.map(column => {
              const columnStories = getStoriesByStatus(column.id);
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
                  <div className="glass-card p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${column.color}`} strokeWidth={1.5} />
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{column.title}</span>
                      </div>
                      <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-xs">
                        {columnStories.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Stories */}
                  <div className="flex-1 space-y-2 min-h-[300px]">
                    {columnStories.map(story => (
                      <div
                        key={story.story_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, story.story_id)}
                        className="glass-card p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group"
                        data-testid={`story-card-${story.story_id}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(story.priority)}`} />
                              {story.epic && (
                                <Badge className="bg-cyan-500/10 text-cyan-600 text-xs">{story.epic}</Badge>
                              )}
                            </div>
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                              {story.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Badge className="bg-blue-500/10 text-blue-600">{story.story_points || 0} pts</Badge>
                              </div>
                              <Select
                                value={story.sprint_id || 'backlog'}
                                onValueChange={(value) => handleAssignToSprint(story.story_id, value === 'backlog' ? null : value)}
                              >
                                <SelectTrigger className="h-6 w-24 text-xs rounded-lg border-0 bg-slate-100 dark:bg-white/5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="backlog">Backlog</SelectItem>
                                  {sprints.map(s => (
                                    <SelectItem key={s.sprint_id} value={s.sprint_id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnStories.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                        <p className="text-xs text-slate-400">Drop stories here</p>
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
