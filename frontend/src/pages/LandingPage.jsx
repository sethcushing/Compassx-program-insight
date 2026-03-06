import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useTheme } from '../App';
import { Button } from '../components/ui/button';
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  Target, 
  Zap, 
  Shield,
  ChevronRight,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const errorMessage = location.state?.error;

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = () => {
    setIsLoggingIn(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Planning',
      description: 'Generate complete project plans from a simple description. AI handles phases, tasks, milestones, and dependencies.'
    },
    {
      icon: BarChart3,
      title: 'Intelligent Analytics',
      description: 'Predictive risk detection, velocity tracking, and automated status reporting with actionable insights.'
    },
    {
      icon: Users,
      title: 'Resource Intelligence',
      description: 'Smart capacity management with automatic workload balancing and availability forecasting.'
    },
    {
      icon: Target,
      title: 'Milestone Tracking',
      description: 'Real-time health indicators with AI-recommended mitigation actions for at-risk deliverables.'
    },
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Integrate with GitHub, Jira, and CI/CD systems to automatically update task status.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Role-based access control, SSO support, and comprehensive audit logging.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <header className="glass-topbar">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CompassX</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={1.5} />
              ) : (
                <Sun className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              )}
            </button>
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
              data-testid="login-button"
            >
              {isLoggingIn ? 'Redirecting...' : 'Sign In'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            {errorMessage && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400" data-testid="error-message">
                {errorMessage}
              </div>
            )}
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              <span>AI-Native Project Intelligence</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              The Future of
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-600"> Project Management</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform how you plan, track, and deliver projects. Let AI handle the complexity while you focus on what matters most.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="h-14 px-10 rounded-full bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95 group"
                data-testid="hero-login-button"
              >
                {isLoggingIn ? 'Redirecting...' : (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </>
                )}
              </Button>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Restricted to CompassX employees
              </p>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative animate-slide-up stagger-2">
            <div className="glass-card p-2 max-w-5xl mx-auto">
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 aspect-[16/9] flex items-center justify-center">
                <div className="p-8 w-full">
                  {/* Mock Dashboard UI */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {['12 Projects', '48 Tasks', '6 At Risk', '92% Velocity'].map((stat, i) => (
                      <div key={i} className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.split(' ')[0]}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{stat.split(' ').slice(1).join(' ')}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 glass-card p-4 h-40">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Velocity Trend</div>
                      <div className="flex items-end gap-2 h-24">
                        {[40, 55, 45, 65, 50, 70, 60, 80, 75, 85, 78, 90].map((h, i) => (
                          <div key={i} className="flex-1 bg-indigo-500/20 rounded-t" style={{ height: `${h}%` }}>
                            <div className="w-full bg-blue-500 rounded-t" style={{ height: '30%' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-4 h-40">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Team Capacity</div>
                      <div className="space-y-3">
                        {[85, 72, 90, 65].map((p, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500" />
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl -z-10 opacity-50" />
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              Enterprise-Grade Intelligence
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Built for modern PMOs that demand precision, automation, and insights at scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="glass-card-hover p-6 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                Ready to Transform Your Projects?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
                Join the next generation of project management. Sign in with your CompassX account to get started.
              </p>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="h-14 px-10 rounded-full bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95"
                data-testid="cta-login-button"
              >
                {isLoggingIn ? 'Redirecting...' : 'Sign In with Google'}
                <ChevronRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500 dark:text-slate-500">
          <p>&copy; {new Date().getFullYear()} CompassX. AI-Driven Project Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
