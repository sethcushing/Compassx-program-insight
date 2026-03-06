import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import { toast } from 'sonner';
import { Sidebar } from './Dashboard';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  MessageSquare, Send, Sparkles, User, Loader2, Lightbulb, RefreshCw
} from 'lucide-react';

const AICopilot = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadProjects();
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm your AI Project Copilot. I can help you with:

• **Project insights** - Ask about status, risks, or blockers
• **Task management** - Find overdue tasks or workload issues  
• **Recommendations** - Get AI-powered suggestions for improvements
• **Reports** - Generate summaries and updates

Select a specific project for focused insights, or ask about your entire portfolio. How can I assist you today?`
    }]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai/chat`, {
        message: input,
        project_id: selectedProject !== 'all' ? selectedProject : null
      }, { withCredentials: true });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What projects are at risk this week?",
    "Show me overdue tasks",
    "Which team members are overloaded?",
    "Generate a status report",
    "What blockers should I address first?",
    "Summarize recent progress"
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?'
    }]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar currentPage="copilot" />
      
      <main className="ml-20 lg:ml-64 p-6 lg:p-8 flex flex-col h-screen" data-testid="ai-copilot-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              <span>AI-Powered</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Copilot
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-56 rounded-xl" data-testid="project-context-selector">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearChat} className="rounded-xl" data-testid="clear-chat">
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Clear
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${message.id}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {message.role === 'assistant' ? (
                      <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
                    ) : (
                      <User className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl max-w-[85%] ${
                      message.role === 'assistant'
                        ? 'bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
                <span>Suggested questions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    data-testid={`suggested-question-${index}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex gap-4 max-w-4xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your projects, tasks, or get AI recommendations..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-xl bg-white dark:bg-slate-800/50"
                data-testid="chat-input"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-[60px] w-[60px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                data-testid="send-button"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Send className="w-5 h-5" strokeWidth={1.5} />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              AI responses are generated based on your project data. Always verify critical information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICopilot;
