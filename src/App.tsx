import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Search, 
  User, 
  Package, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  Terminal, 
  FileCode, 
  BookOpen,
  AlertCircle,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [observation, setObservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'logs'>('dashboard');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const resetTask = async (taskId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      });
      const data = await res.json();
      setObservation(data);
      setCurrentTask(tasks.find(t => t.id === taskId));
      setHistory([]);
    } catch (err) {
      console.error("Failed to reset task", err);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (actionType: string, params: any) => {
    setLoading(true);
    try {
      const res = await fetch('/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, parameters: params })
      });
      const data = await res.json();
      setObservation(data.observation);
      setHistory(prev => [...prev, { action: actionType, params, reward: data.reward.value }]);
    } catch (err) {
      console.error("Failed to perform action", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SupportAgent OpenEnv</h1>
              <p className="text-xs text-slate-400 font-mono">v1.0.0 • openenv-spec</p>
            </div>
          </div>
          <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['dashboard', 'files', 'logs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Tasks & Controls */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Available Tasks
                    </h2>
                  </div>
                  <div className="p-2 space-y-1">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => resetTask(task.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between group ${
                          currentTask?.id === task.id 
                            ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-100' 
                            : 'hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{task.name}</p>
                          <p className="text-xs opacity-60 uppercase tracking-wider">{task.difficulty}</p>
                        </div>
                        <Play className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentTask?.id === task.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </section>

                {observation && (
                  <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                    <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-widest">Manual Controls</h2>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => performAction('search_kb', { query: 'password' })}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" /> Search KB
                      </button>
                      <button 
                        onClick={() => performAction('get_user', { user_id: 'user_123' })}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> Get User
                      </button>
                      <button 
                        onClick={() => performAction('get_order', { order_id: 'order_999' })}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" /> Get Order
                      </button>
                      <button 
                        onClick={() => performAction('reply', { message: 'Hello, how can I help?' })}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Reply
                      </button>
                    </div>
                    <button 
                      onClick={() => performAction('resolve', {})}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Ticket
                    </button>
                  </section>
                )}
              </div>

              {/* Right Column: Observation & State */}
              <div className="lg:col-span-8 space-y-6">
                {!observation ? (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 p-12 text-center">
                    <div className="bg-slate-800 p-4 rounded-full mb-4">
                      <RefreshCw className="w-8 h-8 text-slate-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select a Task to Begin</h3>
                    <p className="text-slate-400 max-w-md">
                      Choose a customer support scenario from the left to initialize the environment and start the agent simulation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Observation Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-5 h-5 text-indigo-400" />
                          <span className="font-mono text-sm font-bold text-white">{observation.ticket_id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            observation.status === 'Open' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {observation.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                          <span>Steps: {history.length}</span>
                          <span>Reward: {history.reduce((acc, h) => acc + h.reward, 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                          <p className="text-lg text-white font-medium leading-relaxed">
                            {observation.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> Last Action Result
                            </h4>
                            <p className="text-sm text-slate-300 italic">
                              "{observation.last_action_result}"
                            </p>
                          </div>
                          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Send className="w-3 h-3" /> Messages Sent
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                              {observation.messages_sent.length === 0 ? (
                                <p className="text-xs text-slate-600 italic">No messages sent yet.</p>
                              ) : (
                                observation.messages_sent.map((msg: string, i: number) => (
                                  <div key={i} className="bg-indigo-600/10 border border-indigo-500/20 p-2 rounded text-xs text-indigo-200">
                                    {msg}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Data Panels */}
                        <div className="space-y-4">
                          {observation.kb_results && (
                            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Knowledge Base Results</h4>
                              <div className="space-y-2">
                                {observation.kb_results.map((res: string, i: number) => (
                                  <div key={i} className="text-xs text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                                    {res}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {observation.user_data && (
                              <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">User Data</h4>
                                <pre className="text-[10px] text-indigo-400 font-mono">
                                  {JSON.stringify(observation.user_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {observation.order_data && (
                              <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Order Data</h4>
                                <pre className="text-[10px] text-emerald-400 font-mono">
                                  {JSON.stringify(observation.order_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* History Log */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="p-3 border-b border-slate-800 bg-slate-800/30">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trajectory Log</h3>
                      </div>
                      <div className="p-4 space-y-3 max-h-60 overflow-y-auto font-mono text-[10px]">
                        {history.map((h, i) => (
                          <div key={i} className="flex gap-4 border-l-2 border-slate-800 pl-4 py-1">
                            <span className="text-slate-600">[{i+1}]</span>
                            <span className="text-indigo-400 font-bold">{h.action}</span>
                            <span className="text-slate-500 truncate max-w-xs">{JSON.stringify(h.params)}</span>
                            <span className={`ml-auto font-bold ${h.reward > 0 ? 'text-emerald-500' : h.reward < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                              {h.reward > 0 ? '+' : ''}{h.reward.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div 
              key="files"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-8 text-center border-b border-slate-800">
                <FileCode className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">OpenEnv Source Files</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  These files implement the full OpenEnv specification in Python, including Pydantic models, 
                  state management, and task-specific graders.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {[
                  { name: 'environment.py', desc: 'Core logic & state machine' },
                  { name: 'models.py', desc: 'Pydantic spec models' },
                  { name: 'tasks.py', desc: 'Task definitions & graders' },
                  { name: 'app.py', desc: 'FastAPI server entry point' },
                  { name: 'inference.py', desc: 'Baseline agent script' },
                  { name: 'openenv.yaml', desc: 'Environment metadata' },
                  { name: 'Dockerfile', desc: 'Containerization spec' },
                  { name: 'validate_spec.py', desc: 'Spec compliance tester' },
                ].map((file) => (
                  <div key={file.name} className="bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-indigo-400 font-bold">{file.name}</span>
                      <FileCode className="w-4 h-4 text-slate-700 group-hover:text-indigo-500" />
                    </div>
                    <p className="text-xs text-slate-500">{file.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  System Logs
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 uppercase font-bold">Live</span>
              </div>
              <div className="bg-black rounded-xl p-6 space-y-2 overflow-y-auto max-h-[500px] custom-scrollbar">
                <p className="text-slate-500">[SYSTEM] Initializing SupportAgent OpenEnv v1.0.0...</p>
                <p className="text-emerald-500">[INFO] FastAPI server listening on port 3000</p>
                <p className="text-indigo-400">[INFO] Knowledge Base loaded with 4 articles</p>
                <p className="text-indigo-400">[INFO] User Database connected: 2 records found</p>
                <p className="text-indigo-400">[INFO] Order Database connected: 2 records found</p>
                <p className="text-slate-500">[SYSTEM] Ready for reset() calls</p>
                {history.map((h, i) => (
                  <p key={i} className="text-slate-300">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> 
                    <span className="text-amber-400"> STEP </span> 
                    {h.action} - Reward: {h.reward.toFixed(2)}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
