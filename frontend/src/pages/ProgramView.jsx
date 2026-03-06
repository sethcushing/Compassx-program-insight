import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Sidebar } from './Dashboard';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Briefcase, TrendingUp, AlertTriangle, CheckCircle2, Clock, ChevronRight, ChevronDown,
  Target, Users, Calendar, Layers, BookOpen
} from 'lucide-react';

const ProgramView = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        axios.get(`${API}/projects`, { withCredentials: true }),
        axios.get(`${API}/dashboard/stats`, { withCredentials: true })
      ]);
      
      // Load detailed data for each project
      const detailedProjects = await Promise.all(
        projectsRes.data.map(async (project) => {
          try {
            const detailRes = await axios.get(`${API}/projects/${project.project_id}`, { withCredentials: true });
            return detailRes.data;
          } catch (e) {
            return project;
          }
        })
      );
      
      setProjects(detailedProjects);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading program data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: { bg: 'bg-slate-500', text: 'text-slate-600' },
      active: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
      on_hold: { bg: 'bg-amber-500', text: 'text-amber-600' },
      completed: { bg: 'bg-blue-500', text: 'text-blue-600' }
    };
    return colors[status] || colors.planning;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'on_track': return 'bg-emerald-500';
      case 'at_risk': return 'bg-amber-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

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

  // Calculate program-level metrics
  const programMetrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalStories: projects.reduce((acc, p) => acc + (p.stories?.length || 0), 0),
    completedStories: projects.reduce((acc, p) => acc + (p.stories?.filter(s => s.status === 'done').length || 0), 0),
    totalMilestones: projects.reduce((acc, p) => acc + (p.milestones?.length || 0), 0),
    atRiskMilestones: projects.reduce((acc, p) => acc + (p.milestones?.filter(m => m.health_status === 'at_risk' || m.health_status === 'delayed').length || 0), 0),
    totalStoryPoints: projects.reduce((acc, p) => acc + (p.stories?.reduce((sum, s) => sum + (s.story_points || 0), 0) || 0), 0),
    completedStoryPoints: projects.reduce((acc, p) => acc + (p.stories?.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.story_points || 0), 0) || 0), 0)
  };

  const statusData = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#10b981' },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#64748b' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length, color: '#f59e0b' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="program" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading program view...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="program" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="program-view-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            Program View
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Executive overview of all projects with rolled-up metrics
          </p>
        </div>

        {/* Key Program Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{programMetrics.totalProjects}</div>
                <div className="text-sm text-slate-500">Total Projects</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {programMetrics.completedStoryPoints}/{programMetrics.totalStoryPoints}
                </div>
                <div className="text-sm text-slate-500">Story Points</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-cyan-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{programMetrics.totalMilestones}</div>
                <div className="text-sm text-slate-500">Total Milestones</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{programMetrics.atRiskMilestones}</div>
                <div className="text-sm text-slate-500">At Risk</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Project Status Distribution */}
          <div className="lg:col-span-4 glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT STATUS</h3>
            {statusData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
              <div className="h-48 flex items-center justify-center text-slate-400">
                No data
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Story Points by Project */}
          <div className="lg:col-span-8 glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">STORY POINTS BY PROJECT</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={projects.map(p => ({
                    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                    total: p.stories?.reduce((sum, s) => sum + (s.story_points || 0), 0) || 0,
                    completed: p.stories?.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.story_points || 0), 0) || 0
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="4" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="rgba(59, 130, 246, 0.3)" radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Projects with Drill-Down */}
        <div className="glass-card p-6" data-testid="projects-drilldown">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">PROJECT DETAILS</h3>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-slate-500">No projects in program</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => {
                const isExpanded = expandedProjects.has(project.project_id);
                const statusColors = getStatusColor(project.status);
                const totalPoints = project.stories?.reduce((sum, s) => sum + (s.story_points || 0), 0) || 0;
                const completedPoints = project.stories?.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.story_points || 0), 0) || 0;
                const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

                return (
                  <div key={project.project_id} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                    {/* Project Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      onClick={() => toggleProject(project.project_id)}
                      data-testid={`project-row-${project.project_id}`}
                    >
                      <div className="flex items-center gap-4">
                        <button className="p-1">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{project.name}</h4>
                            <Badge className={`${statusColors.text} bg-opacity-20`} style={{ backgroundColor: `${statusColors.bg}20` }}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 truncate">{project.description}</p>
                        </div>

                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-slate-900 dark:text-white">{completedPoints}/{totalPoints}</div>
                            <div className="text-xs text-slate-400">Points</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-900 dark:text-white">{project.stories?.length || 0}</div>
                            <div className="text-xs text-slate-400">Stories</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-900 dark:text-white">{project.milestones?.length || 0}</div>
                            <div className="text-xs text-slate-400">Milestones</div>
                          </div>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400">Progress</span>
                              <span className="font-medium text-slate-900 dark:text-white">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.project_id}`); }}
                          className="rounded-lg"
                        >
                          View
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Milestones */}
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Milestones</h5>
                            {project.milestones?.length > 0 ? (
                              <div className="space-y-2">
                                {project.milestones.slice(0, 4).map(ms => (
                                  <div key={ms.milestone_id} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getHealthColor(ms.health_status)}`} />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{ms.title}</span>
                                    <span className="text-xs text-slate-400">{ms.target_date}</span>
                                  </div>
                                ))}
                                {project.milestones.length > 4 && (
                                  <p className="text-xs text-slate-400">+{project.milestones.length - 4} more</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">No milestones</p>
                            )}
                          </div>

                          {/* Sprints */}
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Sprints</h5>
                            {project.sprints?.length > 0 ? (
                              <div className="space-y-2">
                                {project.sprints.slice(0, 4).map(sprint => (
                                  <div key={sprint.sprint_id} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{sprint.name}</span>
                                    <Badge className={`text-xs ${
                                      sprint.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' :
                                      sprint.status === 'completed' ? 'bg-blue-500/20 text-blue-600' :
                                      'bg-slate-500/20 text-slate-600'
                                    }`}>
                                      {sprint.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">No sprints</p>
                            )}
                          </div>

                          {/* Risks */}
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Risks</h5>
                            {project.risks?.length > 0 ? (
                              <div className="space-y-2">
                                {project.risks.filter(r => r.status === 'open').slice(0, 3).map(risk => (
                                  <div key={risk.risk_id} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{risk.description}</span>
                                  </div>
                                ))}
                                {project.risks.filter(r => r.status === 'open').length > 3 && (
                                  <p className="text-xs text-slate-400">+{project.risks.filter(r => r.status === 'open').length - 3} more</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">No active risks</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProgramView;
