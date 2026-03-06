import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Sidebar } from './Dashboard';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Briefcase, TrendingUp, AlertTriangle, CheckCircle2, Clock, ChevronRight, Target
} from 'lucide-react';

const PortfolioDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        axios.get(`${API}/projects`, { withCredentials: true }),
        axios.get(`${API}/dashboard/stats`, { withCredentials: true })
      ]);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: '#64748b',
      active: '#10b981',
      on_hold: '#f59e0b',
      completed: '#3b82f6',
      at_risk: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const statusData = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#10b981' },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#64748b' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length, color: '#f59e0b' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg p-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="portfolio" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading portfolio...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="portfolio" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="portfolio-dashboard-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Executive overview of all projects and portfolio health
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5" data-testid="metric-total-projects">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{projects.length}</div>
                <div className="text-sm text-slate-500">Total Projects</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5" data-testid="metric-active">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-slate-500">Active Projects</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5" data-testid="metric-at-risk">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {(stats?.milestones?.at_risk || 0) + (stats?.milestones?.delayed || 0)}
                </div>
                <div className="text-sm text-slate-500">At Risk Milestones</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5" data-testid="metric-completed">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.tasks?.done || 0}</div>
                <div className="text-sm text-slate-500">Tasks Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Project Status Distribution */}
          <div className="lg:col-span-4 glass-card p-6" data-testid="status-chart">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT STATUS</h3>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-500">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Velocity Trend */}
          <div className="lg:col-span-8 glass-card p-6" data-testid="velocity-trend">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">VELOCITY TREND</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.velocity_data || []}>
                  <CartesianGrid strokeDasharray="4" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="planned" fill="rgba(99, 102, 241, 0.3)" radius={[4, 4, 0, 0]} name="Planned" />
                  <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="glass-card p-6" data-testid="projects-table">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">ALL PROJECTS</h3>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-slate-500">No projects in portfolio</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Priority</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Progress</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Tasks</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Target</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => (
                    <tr 
                      key={project.project_id} 
                      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      data-testid={`project-row-${project.project_id}`}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{project.name}</div>
                          <div className="text-sm text-slate-500 truncate max-w-xs">{project.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          className="font-medium"
                          style={{ backgroundColor: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status) }}
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`
                          ${project.priority === 'low' ? 'bg-slate-500/20 text-slate-600' : ''}
                          ${project.priority === 'medium' ? 'bg-blue-500/20 text-blue-600' : ''}
                          ${project.priority === 'high' ? 'bg-amber-500/20 text-amber-600' : ''}
                          ${project.priority === 'critical' ? 'bg-red-500/20 text-red-600' : ''}
                        `}>
                          {project.priority}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 w-40">
                        <div className="flex items-center gap-3">
                          <Progress value={project.progress || 0} className="h-2 flex-1" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white w-10">
                            {project.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                          {project.tasks_done || 0}/{project.task_count || 0}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" strokeWidth={1.5} />
                          {project.target_date || 'TBD'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link 
                          to={`/project/${project.project_id}`}
                          className="text-indigo-500 hover:text-indigo-600 font-medium text-sm"
                        >
                          View <ChevronRight className="w-4 h-4 inline" strokeWidth={1.5} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PortfolioDashboard;
