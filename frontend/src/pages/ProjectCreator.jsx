import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Sparkles, Wand2, CheckCircle2, Target, ListTodo, BookOpen,
  Loader2, ArrowRight, Lightbulb
} from 'lucide-react';

const ProjectCreator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState({
    includeMilestones: true,
    includeTasks: true,
    includeStories: true
  });
  const [generating, setGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState(null);

  const examplePrompts = [
    "Build a mobile app MVP for a fintech startup with payment processing and user authentication",
    "Launch a new e-commerce product line with marketing campaign and inventory management",
    "Modernize a legacy data warehouse to cloud-native architecture with real-time analytics",
    "Deploy an enterprise AI chatbot with multi-language support and CRM integration",
    "Create a customer loyalty program with gamification and rewards system"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a project description');
      return;
    }

    setGenerating(true);
    setGeneratedProject(null);

    try {
      const response = await axios.post(`${API}/ai/generate-project`, {
        prompt: prompt,
        include_milestones: options.includeMilestones,
        include_tasks: options.includeTasks,
        include_stories: options.includeStories
      }, { withCredentials: true });

      setGeneratedProject(response.data);
      toast.success('Project generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate project');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewProject = () => {
    if (generatedProject?.project_id) {
      navigate(`/project/${generatedProject.project_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="create" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8" data-testid="project-creator-main">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            <span>AI-Powered</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            AI Project Creator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Describe your project idea and let AI generate a comprehensive plan with phases, milestones, tasks, and user stories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Prompt Input */}
            <div className="glass-card p-6" data-testid="prompt-section">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                PROJECT DESCRIPTION
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project... e.g., Build a mobile app MVP for a fintech startup"
                className="min-h-[160px] bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/10 rounded-xl resize-none"
                data-testid="project-prompt-input"
              />
              
              {/* Example Prompts */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
                  <span>Try an example:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.slice(0, 3).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      data-testid={`example-prompt-${index}`}
                    >
                      {example.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="glass-card p-6" data-testid="options-section">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                GENERATION OPTIONS
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
                    <Label htmlFor="milestones" className="text-slate-700 dark:text-slate-300">Include Milestones</Label>
                  </div>
                  <Switch
                    id="milestones"
                    checked={options.includeMilestones}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeMilestones: checked }))}
                    data-testid="toggle-milestones"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ListTodo className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                    <Label htmlFor="tasks" className="text-slate-700 dark:text-slate-300">Include Tasks</Label>
                  </div>
                  <Switch
                    id="tasks"
                    checked={options.includeTasks}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeTasks: checked }))}
                    data-testid="toggle-tasks"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
                    <Label htmlFor="stories" className="text-slate-700 dark:text-slate-300">Include User Stories</Label>
                  </div>
                  <Switch
                    id="stories"
                    checked={options.includeStories}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeStories: checked }))}
                    data-testid="toggle-stories"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
              data-testid="generate-button"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
                  Generating Project Plan...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Generate Project Plan
                </>
              )}
            </Button>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            {generating && (
              <div className="glass-card p-12 text-center animate-pulse" data-testid="generating-indicator">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">AI is Working...</h3>
                <p className="text-slate-500 dark:text-slate-400">Generating your comprehensive project plan</p>
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <p>Creating project phases...</p>
                  <p>Defining milestones...</p>
                  <p>Breaking down tasks...</p>
                  <p>Writing user stories...</p>
                </div>
              </div>
            )}

            {generatedProject && !generating && (
              <div className="glass-card p-6 animate-slide-up" data-testid="generated-project">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Project Generated!</h3>
                    <p className="text-sm text-slate-500">Your AI-powered project plan is ready</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">PROJECT NAME</h4>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{generatedProject.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">DESCRIPTION</h4>
                    <p className="text-slate-600 dark:text-slate-400">{generatedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold text-indigo-600">{generatedProject.milestones?.length || 0}</div>
                      <div className="text-sm text-slate-500">Milestones</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold text-emerald-600">{generatedProject.tasks?.length || 0}</div>
                      <div className="text-sm text-slate-500">Tasks</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold text-purple-600">{generatedProject.stories?.length || 0}</div>
                      <div className="text-sm text-slate-500">User Stories</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold text-amber-600">{generatedProject.phases?.length || 0}</div>
                      <div className="text-sm text-slate-500">Phases</div>
                    </div>
                  </div>

                  {generatedProject.phases && generatedProject.phases.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">PROJECT PHASES</h4>
                      <div className="space-y-2">
                        {generatedProject.phases.map((phase, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-medium text-xs">
                              {index + 1}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300">{phase.name}</span>
                            <span className="text-slate-400">({phase.duration_weeks} weeks)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleViewProject}
                  className="w-full h-12 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all"
                  data-testid="view-project-button"
                >
                  View Full Project
                  <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
                </Button>
              </div>
            )}

            {!generating && !generatedProject && (
              <div className="glass-card p-12 text-center" data-testid="empty-state">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-10 h-10 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Ready to Create</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Enter your project description and click generate to create a comprehensive AI-powered project plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectCreator;
