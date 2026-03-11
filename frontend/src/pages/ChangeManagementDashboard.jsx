import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  FileCheck, Plus, Clock, CheckCircle2, XSquare, Rocket, FileText,
  ThumbsUp, ThumbsDown, Trash2, AlertTriangle, Filter
} from 'lucide-react';

const statusStyles = {
  draft: { label: 'Draft', icon: FileText, bg: 'bg-slate-500/10', text: 'text-slate-500', badge: 'bg-slate-500/20 text-slate-600' },
  pending_review: { label: 'Pending Review', icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-500', badge: 'bg-amber-500/20 text-amber-600' },
  approved: { label: 'Approved', icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-500', badge: 'bg-emerald-500/20 text-emerald-600' },
  rejected: { label: 'Rejected', icon: XSquare, bg: 'bg-red-500/10', text: 'text-red-500', badge: 'bg-red-500/20 text-red-600' },
  implemented: { label: 'Implemented', icon: Rocket, bg: 'bg-blue-500/10', text: 'text-blue-500', badge: 'bg-blue-500/20 text-blue-600' }
};

const impactColors = {
  low: 'bg-slate-500/20 text-slate-600',
  medium: 'bg-amber-500/20 text-amber-600',
  high: 'bg-orange-500/20 text-orange-600',
  critical: 'bg-red-500/20 text-red-600'
};

const riskColors = {
  low: 'bg-slate-500/20 text-slate-600',
  medium: 'bg-amber-500/20 text-amber-600',
  high: 'bg-red-500/20 text-red-600'
};

const ChangeManagementDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newChange, setNewChange] = useState({
    project_id: '', title: '', description: '', change_type: 'feature', impact: 'medium', risk_level: 'medium', target_date: '', rollback_plan: ''
  });

  useEffect(() => {
    loadDashboard();
    loadProjects();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await axios.get(`${API}/change-management/dashboard`, { withCredentials: true });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading change management dashboard:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(res.data);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleAdd = async () => {
    if (!newChange.title.trim() || !newChange.project_id) {
      toast.error('Title and project are required');
      return;
    }
    try {
      await axios.post(`${API}/change-requests`, newChange, { withCredentials: true });
      toast.success('Change request created');
      setIsAddOpen(false);
      setNewChange({ project_id: '', title: '', description: '', change_type: 'feature', impact: 'medium', risk_level: 'medium', target_date: '', rollback_plan: '' });
      loadDashboard();
    } catch (err) {
      toast.error('Failed to create change request');
    }
  };

  const handleStatusChange = async (changeId, newStatus) => {
    try {
      await axios.patch(`${API}/change-requests/${changeId}`, { status: newStatus }, { withCredentials: true });
      toast.success(`Change request ${newStatus}`);
      loadDashboard();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/change-requests/${id}`, { withCredentials: true });
      toast.success('Change request deleted');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="changes" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading change management...</p>
          </div>
        </main>
      </div>
    );
  }

  const filteredRequests = dashboardData?.recent_requests?.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="changes" />

      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="change-management-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Change Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track and approve releases across all projects
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700" data-testid="create-change-btn">
                <Plus className="w-4 h-4 mr-2" /> New Change Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Change Request</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project *</label>
                  <Select value={newChange.project_id} onValueChange={(v) => setNewChange(p => ({ ...p, project_id: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.project_id} value={p.project_id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input value={newChange.title} onChange={(e) => setNewChange(p => ({ ...p, title: e.target.value }))} placeholder="Change title" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea value={newChange.description} onChange={(e) => setNewChange(p => ({ ...p, description: e.target.value }))} placeholder="Describe the change..." className="rounded-xl min-h-[80px]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select value={newChange.change_type} onValueChange={(v) => setNewChange(p => ({ ...p, change_type: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="enhancement">Enhancement</SelectItem>
                        <SelectItem value="bugfix">Bug Fix</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Impact</label>
                    <Select value={newChange.impact} onValueChange={(v) => setNewChange(p => ({ ...p, impact: v }))}>
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
                    <label className="text-sm font-medium mb-2 block">Risk</label>
                    <Select value={newChange.risk_level} onValueChange={(v) => setNewChange(p => ({ ...p, risk_level: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Date</label>
                  <Input type="date" value={newChange.target_date} onChange={(e) => setNewChange(p => ({ ...p, target_date: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Rollback Plan</label>
                  <Textarea value={newChange.rollback_plan} onChange={(e) => setNewChange(p => ({ ...p, rollback_plan: e.target.value }))} placeholder="How to rollback if issues occur..." className="rounded-xl min-h-[60px]" />
                </div>
                <Button onClick={handleAdd} className="w-full rounded-full bg-blue-600">Create Change Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData?.by_status?.pending_review || 0}</div>
                <div className="text-sm text-slate-500">Pending Review</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData?.by_status?.approved || 0}</div>
                <div className="text-sm text-slate-500">Approved</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData?.by_status?.implemented || 0}</div>
                <div className="text-sm text-slate-500">Implemented</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData?.by_impact?.critical || 0}</div>
                <div className="text-sm text-slate-500">Critical Impact</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approval Section */}
        {dashboardData?.pending_approval?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
              AWAITING YOUR REVIEW
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.pending_approval.map((change) => (
                <div key={change.change_id} className="glass-card p-5 border-l-4 border-amber-500" data-testid={`pending-card-${change.change_id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{change.title}</h4>
                      <p className="text-xs text-slate-500">{change.project_name}</p>
                    </div>
                    <Badge className={impactColors[change.impact]}>{change.impact}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{change.description}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleStatusChange(change.change_id, 'approved')} className="rounded-full bg-emerald-500 text-white flex-1" data-testid={`approve-btn-${change.change_id}`}>
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(change.change_id, 'rejected')} className="rounded-full text-red-500 border-red-500 flex-1" data-testid={`reject-btn-${change.change_id}`}>
                      <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">ALL CHANGE REQUESTS</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 rounded-xl" data-testid="status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No change requests found.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Risk</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {filteredRequests.map((change) => {
                      const cfg = statusStyles[change.status] || statusStyles.draft;
                      return (
                        <tr key={change.change_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" data-testid={`change-row-${change.change_id}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">{change.title}</div>
                            {change.description && <div className="text-xs text-slate-500 truncate max-w-sm">{change.description}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/project/${change.project_id}`} className="text-sm text-blue-500 hover:underline">
                              {change.project_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={impactColors[change.impact]}>{change.impact}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={riskColors[change.risk_level] || riskColors.medium}>{change.risk_level}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cfg.badge}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {change.status === 'draft' && (
                                <Button size="sm" onClick={() => handleStatusChange(change.change_id, 'pending_review')} className="rounded-full bg-amber-500 text-white text-xs h-7 px-3">
                                  Submit
                                </Button>
                              )}
                              {change.status === 'pending_review' && (
                                <>
                                  <Button size="sm" onClick={() => handleStatusChange(change.change_id, 'approved')} className="rounded-full bg-emerald-500 text-white text-xs h-7 px-3">
                                    <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(change.change_id, 'rejected')} className="rounded-full text-red-500 border-red-500 text-xs h-7 px-3">
                                    <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {change.status === 'approved' && (
                                <Button size="sm" onClick={() => handleStatusChange(change.change_id, 'implemented')} className="rounded-full bg-blue-500 text-white text-xs h-7 px-3">
                                  <Rocket className="w-3 h-3 mr-1" /> Implement
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Change Request?</AlertDialogTitle>
                                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(change.change_id)} className="bg-red-500">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChangeManagementDashboard;
