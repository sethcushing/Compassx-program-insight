import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Briefcase, Plus, Search, Filter, ChevronRight, Calendar, Target,
  CheckCircle2, Clock, TrendingUp, AlertTriangle, Sparkles
} from 'lucide-react';

const AllProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium',
    start_date: '',
    target_date: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    try {
      const response = await axios.post(`${API}/projects`, newProject, { withCredentials: true });
      toast.success('Project created successfully!');
      setIsAddProjectOpen(false);
      setNewProject({ name: '', description: '', priority: 'medium', start_date: '', target_date: '' });
      navigate(`/project/${response.data.project_id}`);
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-slate-500',
      active: 'bg-emerald-500',
      on_hold: 'bg-amber-500',
      completed: 'bg-blue-500'
    };
    return colors[status] || 'bg-slate-400';
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
        <Sidebar currentPage="projects" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading projects...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="projects" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="all-projects-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              All Projects
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage and track all your projects in one place
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/create')} className="rounded-full">
              <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
              AI Creator
            </Button>
            <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="add-project-button">
                  <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name *</label>
                    <Input
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your project"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={newProject.priority} onValueChange={(value) => setNewProject(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="rounded-xl">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, start_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Date</label>
                      <Input
                        type="date"
                        value={newProject.target_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, target_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddProject} className="w-full rounded-full bg-blue-600">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="pl-10 rounded-xl"
                  data-testid="search-projects"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 rounded-xl" data-testid="priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {projects.length === 0 ? 'No Projects Yet' : 'No Matching Projects'}
            </h3>
            <p className="text-slate-500 mb-6">
              {projects.length === 0 
                ? 'Create your first project to get started.' 
                : 'Try adjusting your search or filters.'}
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setIsAddProjectOpen(true)} className="rounded-full bg-blue-600">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
            {filteredProjects.map((project) => (
              <Link
                key={project.project_id}
                to={`/project/${project.project_id}`}
                className="glass-card-hover p-6 block"
                data-testid={`project-card-${project.project_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{project.status}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{project.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium text-slate-900 dark:text-white">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                        <span>{project.tasks_done || 0}/{project.task_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" strokeWidth={1.5} />
                        <span>{project.milestone_count || 0}</span>
                      </div>
                    </div>
                    {getPriorityBadge(project.priority)}
                  </div>
                  
                  {project.target_date && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 pt-1">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} />
                      Target: {project.target_date}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllProjects;
