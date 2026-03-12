import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useTheme } from '../App';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Sparkles, LayoutDashboard, FolderKanban, Users, Target, MessageSquare,
  Plus, ChevronRight, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Sun, Moon, Briefcase, Activity, BarChart3, Calendar, FileCheck,
  ShieldAlert, ListTodo, CheckSquare
} from 'lucide-react';

// Sidebar Component
export const Sidebar = ({ currentPage }) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', id: 'dashboard' },
    { icon: Briefcase, label: 'All Projects', href: '/projects', id: 'projects' },
    { icon: FolderKanban, label: 'Sprint Board', href: '/sprint', id: 'sprint' },
    { icon: Users, label: 'Resources', href: '/resources', id: 'resources' },
    { icon: Target, label: 'Program View', href: '/program', id: 'program' },
    { icon: FileCheck, label: 'Change Mgmt', href: '/changes', id: 'changes' },
    { icon: Sparkles, label: 'AI Creator', href: '/create', id: 'create' },
    { icon: MessageSquare, label: 'AI Copilot', href: '/copilot', id: 'copilot' },
  ];

  return (
    <aside className="glass-sidebar w-20 lg:w-64 flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <span className="hidden lg:block text-xl font-bold text-slate-900 dark:text-white tracking-tight">CompassX</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 lg:px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-500' : ''}`} strokeWidth={1.5} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - Theme Toggle Only */}
      <div className="p-3 lg:p-4 border-t border-white/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          data-testid="sidebar-theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Sun className="w-5 h-5" strokeWidth={1.5} />
          )}
          <span className="hidden lg:block font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-pink-600'
  };

  return (
    <div className="glass-card-hover p-6" data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      {subValue && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</div>}
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }) => {
  const statusColors = {
    planning: 'bg-slate-500',
    active: 'bg-emerald-500',
    on_hold: 'bg-amber-500',
    completed: 'bg-blue-500',
    at_risk: 'bg-red-500'
  };

  return (
    <Link 
      to={`/project/${project.project_id}`}
      className="glass-card-hover p-6 block"
      data-testid={`project-card-${project.project_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${statusColors[project.status] || 'bg-slate-400'}`} />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{project.status}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{project.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{project.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="font-medium text-slate-900 dark:text-white">{project.progress || 0}%</span>
        </div>
        <Progress value={project.progress || 0} className="h-2" />
        
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            <span>{project.tasks_done || 0}/{project.task_count || 0} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" strokeWidth={1.5} />
            <span>{project.milestone_count || 0} milestones</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg p-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [quickAccess, setQuickAccess] = useState(null);
  const [activeQuickTab, setActiveQuickTab] = useState('milestones');
  const [loading, setLoading] = useState(true);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium',
    start_date: '',
    target_date: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, projectsRes, quickRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API}/projects`, { withCredentials: true }),
        axios.get(`${API}/dashboard/quick-access`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setProjects(projectsRes.data);
      setQuickAccess(quickRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
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

  const seedDemoData = async () => {
    try {
      await axios.post(`${API}/seed-demo-data`, {}, { withCredentials: true });
      toast.success('Demo data created successfully!');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to seed demo data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="dashboard" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="dashboard" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="dashboard-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Program Insights Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's an overview of your project portfolio
            </p>
          </div>
          <div className="flex items-center gap-3">
            {projects.length === 0 && (
              <Button
                onClick={seedDemoData}
                variant="outline"
                className="h-11 px-6 rounded-full"
                data-testid="seed-demo-button"
              >
                Load Demo Data
              </Button>
            )}
            <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
              <DialogTrigger asChild>
                <Button
                  className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="create-project-button"
                >
                  <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
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
                      data-testid="new-project-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your project"
                      className="rounded-xl"
                      data-testid="new-project-description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={newProject.priority} onValueChange={(value) => setNewProject(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="rounded-xl" data-testid="new-project-priority">
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
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleAddProject} className="flex-1 rounded-full bg-blue-600" data-testid="submit-project">
                      Create Project
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/create')} className="flex-1 rounded-full">
                      <Sparkles className="w-4 h-4 mr-2" /> Use AI Creator
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Briefcase}
            label="Total Projects"
            value={stats?.projects?.total || 0}
            subValue={`${stats?.projects?.active || 0} active`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tasks Done"
            value={stats?.tasks?.done || 0}
            subValue={`${stats?.tasks?.in_progress || 0} in progress`}
            trend={12}
            color="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={(stats?.milestones?.at_risk || 0) + (stats?.milestones?.delayed || 0)}
            subValue="milestones need attention"
            color="amber"
          />
          <StatCard
            icon={Activity}
            label="Story Points"
            value={stats?.total_story_points || 0}
            subValue="total in backlog"
            color="blue"
          />
        </div>

        {/* Quick Access: Milestones, Risks, Issues, Decisions, Action Items */}
        {quickAccess && (
          <div className="glass-card p-6 mb-8" data-testid="quick-access-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">QUICK ACCESS</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'milestones', label: 'Milestones', icon: Target, count: quickAccess.milestones?.length || 0 },
                { id: 'risk', label: 'Risks', icon: AlertTriangle, count: quickAccess.raid_items?.filter(i => i.type === 'risk').length || 0 },
                { id: 'issue', label: 'Issues', icon: ShieldAlert, count: quickAccess.raid_items?.filter(i => i.type === 'issue').length || 0 },
                { id: 'decision', label: 'Decisions', icon: CheckSquare, count: quickAccess.raid_items?.filter(i => i.type === 'decision').length || 0 },
                { id: 'action_item', label: 'Action Items', icon: ListTodo, count: quickAccess.raid_items?.filter(i => i.type === 'action_item').length || 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveQuickTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeQuickTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                  data-testid={`quick-tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    activeQuickTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="max-h-[280px] overflow-y-auto" data-testid="quick-access-list">
              {activeQuickTab === 'milestones' ? (
                quickAccess.milestones?.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Milestone</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Project</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Target Date</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {quickAccess.milestones.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/project/${m.project_id}`}>
                          <td className="px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white">{m.title}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-500">{m.project_name}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-500">{m.target_date ? new Date(m.target_date).toLocaleDateString() : '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              m.health_status === 'on_track' ? 'bg-emerald-500/20 text-emerald-600' :
                              m.health_status === 'at_risk' ? 'bg-amber-500/20 text-amber-600' :
                              'bg-red-500/20 text-red-600'
                            }`}>
                              {m.health_status === 'on_track' ? 'On Track' : m.health_status === 'at_risk' ? 'At Risk' : 'Delayed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-sm text-slate-500 text-center py-6">No milestones found</p>
              ) : (
                (() => {
                  const filtered = quickAccess.raid_items?.filter(i => i.type === activeQuickTab) || [];
                  return filtered.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10">
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Title</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Project</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Owner</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Priority</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filtered.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/project/${item.project_id}`}>
                            <td className="px-3 py-2.5">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</div>
                              {item.description && <div className="text-xs text-slate-400 truncate max-w-xs">{item.description}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-500">{item.project_name}</td>
                            <td className="px-3 py-2.5 text-sm text-slate-500">{item.owner || '-'}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.priority === 'critical' ? 'bg-red-500/20 text-red-600' :
                                item.priority === 'high' ? 'bg-orange-500/20 text-orange-600' :
                                item.priority === 'medium' ? 'bg-amber-500/20 text-amber-600' :
                                'bg-slate-500/20 text-slate-600'
                              }`}>{item.priority || 'medium'}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.status === 'open' ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                              }`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-sm text-slate-500 text-center py-6">No {activeQuickTab === 'action_item' ? 'action items' : activeQuickTab + 's'} found</p>;
                })()
              )}
            </div>
          </div>
        )}

        {/* Task Distribution & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Task Distribution */}
          <div className="lg:col-span-4 glass-card p-6" data-testid="task-distribution">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">TASK DISTRIBUTION</h3>
            <div className="space-y-4">
              {[
                { label: 'To Do', value: stats?.tasks?.todo || 0, color: 'bg-slate-500' },
                { label: 'In Progress', value: stats?.tasks?.in_progress || 0, color: 'bg-blue-500' },
                { label: 'In Review', value: stats?.tasks?.in_review || 0, color: 'bg-cyan-500' },
                { label: 'Done', value: stats?.tasks?.done || 0, color: 'bg-emerald-500' },
              ].map((item) => {
                const total = (stats?.tasks?.todo || 0) + (stats?.tasks?.in_progress || 0) + (stats?.tasks?.in_review || 0) + (stats?.tasks?.done || 0);
                const percentage = total > 0 ? (item.value / total * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projects List */}
          <div className="lg:col-span-8" data-testid="projects-list">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">ACTIVE PROJECTS</h3>
              <Link to="/portfolio" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                View All <ChevronRight className="w-4 h-4 inline" strokeWidth={1.5} />
              </Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No projects yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first project or load demo data to get started.</p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={seedDemoData} variant="outline" className="rounded-full" data-testid="empty-seed-button">
                    Load Demo Data
                  </Button>
                  <Button onClick={() => setIsAddProjectOpen(true)} className="rounded-full bg-blue-600 text-white" data-testid="empty-create-button">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Create Project
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project) => (
                  <ProjectCard key={project.project_id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts Row - Story Points & Sprint Burndown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-8 glass-card p-6" data-testid="story-points-chart">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">STORY POINTS</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Total vs Completed</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-500">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500/30" />
                  <span className="text-slate-500">Total</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.story_points_data || []}>
                  <CartesianGrid strokeDasharray="4" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis dataKey="sprint" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="rgba(59, 130, 246, 0.3)" radius={[4, 4, 0, 0]} name="Total Points" />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed Points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-4 glass-card p-6" data-testid="burndown-chart">
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">SPRINT BURNDOWN</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">Current Sprint</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.burndown_data || []}>
                  <CartesianGrid strokeDasharray="4" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="4" fill="none" />
                  <Area type="monotone" dataKey="remaining" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
