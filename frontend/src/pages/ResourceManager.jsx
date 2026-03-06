import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Users, Plus, Mail, Briefcase, Code, Star, Calendar
} from 'lucide-react';

const ResourceManager = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    email: '',
    role: 'Developer',
    skills: '',
    availability: 100
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await axios.get(`${API}/resources`, { withCredentials: true });
      setResources(response.data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResource.name || !newResource.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await axios.post(`${API}/resources`, {
        ...newResource,
        skills: newResource.skills.split(',').map(s => s.trim()).filter(Boolean)
      }, { withCredentials: true });
      toast.success('Resource added successfully');
      setIsAddOpen(false);
      setNewResource({ name: '', email: '', role: 'Developer', skills: '', availability: 100 });
      loadResources();
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  const getAvailabilityColor = (availability) => {
    if (availability >= 80) return 'bg-emerald-500';
    if (availability >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRoleIcon = (role) => {
    const icons = {
      'Project Manager': Briefcase,
      'Tech Lead': Code,
      'Developer': Code,
      'Senior Developer': Code,
      'Designer': Star,
      'UX Designer': Star,
      'QA Engineer': Star,
      'Data Engineer': Code
    };
    return icons[role] || Briefcase;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
        <Sidebar currentPage="resources" />
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading resources...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="resources" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="resource-manager-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Resource Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage team capacity and availability
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="h-11 px-6 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                data-testid="add-resource-button"
              >
                <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Name</label>
                  <Input
                    value={newResource.name}
                    onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    className="rounded-xl"
                    data-testid="resource-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={newResource.email}
                    onChange={(e) => setNewResource(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@compassx.com"
                    className="rounded-xl"
                    data-testid="resource-email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Role</label>
                  <Select
                    value={newResource.role}
                    onValueChange={(value) => setNewResource(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="rounded-xl" data-testid="resource-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                      <SelectItem value="Tech Lead">Tech Lead</SelectItem>
                      <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="UX Designer">UX Designer</SelectItem>
                      <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                      <SelectItem value="Data Engineer">Data Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Skills (comma-separated)</label>
                  <Input
                    value={newResource.skills}
                    onChange={(e) => setNewResource(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="React, Python, AWS"
                    className="rounded-xl"
                    data-testid="resource-skills"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Availability (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newResource.availability}
                    onChange={(e) => setNewResource(prev => ({ ...prev, availability: parseInt(e.target.value) || 0 }))}
                    className="rounded-xl"
                    data-testid="resource-availability"
                  />
                </div>
                <Button onClick={handleAddResource} className="w-full rounded-full bg-indigo-600" data-testid="submit-resource">
                  Add Resource
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{resources.length}</div>
                <div className="text-sm text-slate-500">Total Resources</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {resources.filter(r => r.availability >= 80).length}
                </div>
                <div className="text-sm text-slate-500">Fully Available</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {resources.filter(r => r.availability >= 50 && r.availability < 80).length}
                </div>
                <div className="text-sm text-slate-500">Partial Capacity</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {resources.filter(r => r.availability < 50).length}
                </div>
                <div className="text-sm text-slate-500">Limited Availability</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Resources Yet</h3>
            <p className="text-slate-500 mb-6">Add team members to manage capacity.</p>
            <Button onClick={() => setIsAddOpen(true)} className="rounded-full bg-indigo-600">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add First Resource
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="resources-grid">
            {resources.map(resource => {
              const RoleIcon = getRoleIcon(resource.role);
              
              return (
                <div key={resource.resource_id} className="glass-card-hover p-6" data-testid={`resource-${resource.resource_id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    {resource.avatar ? (
                      <img src={resource.avatar} alt={resource.name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {resource.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{resource.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <RoleIcon className="w-4 h-4" strokeWidth={1.5} />
                        {resource.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                    <span className="truncate">{resource.email}</span>
                  </div>

                  {resource.skills?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {resource.skills.slice(0, 4).map((skill, idx) => (
                          <Badge key={idx} className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {resource.skills.length > 4 && (
                          <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-xs">
                            +{resource.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">Availability</span>
                      <span className="font-medium text-slate-900 dark:text-white">{resource.availability}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getAvailabilityColor(resource.availability)}`} 
                        style={{ width: `${resource.availability}%` }} 
                      />
                    </div>
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

export default ResourceManager;
