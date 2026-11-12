import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Sparkles, 
  Coins, 
  DollarSign, 
  Cpu, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Bot, 
  Zap, 
  Server, 
  Shield,
  ShieldAlert, 
  ArrowUpRight,
  Sliders,
  Check,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';

export default function AIUsageDashboard({ onOpenSettings, onNavigateToEvent }) {
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingModel, setSwitchingModel] = useState(null);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageData, configData, modelsData] = await Promise.all([
        api.getAIUsage(),
        api.getAIConfig(),
        api.getAIModels()
      ]);
      setMetrics(usageData);
      setConfig(configData);
      setModels(modelsData.models || []);
    } catch (err) {
      setError(err.message || 'Failed to load AI usage metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to reset all recorded AI usage logs and counter statistics?')) {
      return;
    }
    try {
      await api.resetAIUsage();
      setSuccessMsg('Usage logs reset successfully.');
      setTimeout(() => setSuccessMsg(null), 2500);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to reset usage metrics');
    }
  };

  const handleSelectModel = async (model) => {
    setSwitchingModel(model.id);
    try {
      const isGemini = model.provider === 'gemini';
      const payload = {
        provider: model.provider,
        geminiModel: isGemini ? model.id : config.geminiModel,
        bedrockModel: !isGemini ? model.id : config.bedrockModel
      };
      await api.updateAIConfig(payload);
      setSuccessMsg(`Switched active model to ${model.name}`);
      setTimeout(() => setSuccessMsg(null), 2500);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to switch model');
    } finally {
      setSwitchingModel(null);
    }
  };

  const handleTestConnection = async (providerToTest) => {
    setTestingProvider(providerToTest);
    setTestResult(null);
    try {
      const res = await api.testAIConnection({
        provider: providerToTest,
        geminiApiKey: config?.geminiApiKey,
        bedrockRegion: config?.bedrockRegion
      });
      setTestResult({ provider: providerToTest, success: true, message: res.message });
      setTimeout(() => setTestResult(null), 4000);
    } catch (err) {
      setTestResult({ provider: providerToTest, success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingProvider(null);
    }
  };

  const copyKeyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const summary = metrics?.summary || { totalAnalyses: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCostUSD: 0 };
  const providerBreakdown = metrics?.providerBreakdown || {};
  const recentLogs = Array.isArray(metrics?.recentLogs) ? metrics.recentLogs : [];

  const activeProvider = config?.provider || 'gemini';
  const activeModelId = activeProvider === 'gemini' ? config?.geminiModel : config?.bedrockModel;
  const safeModels = Array.isArray(models) ? models : [];
  const activeModelObj = safeModels.find(m => m?.id === activeModelId) || { 
    name: activeModelId || (activeProvider === 'gemini' ? 'Gemini 3.5 Flash' : 'Claude 3.5 Sonnet'),
    provider: activeProvider
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading AI usage analytics & cost data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-amber-400" />
              <span>AI Usage, Token Credits & Cost Intelligence</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              Live Tracker
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time credit utilization, actual token expenditure in USD, model switcher, and audit trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Settings & Keys</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Cost */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Actual Cost</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${Number(summary?.totalCostUSD || 0).toFixed(5)}
            <span className="text-xs text-slate-400 font-normal ml-1">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Calculated via official per-token rates
          </p>
        </div>

        {/* Metric 2: Total Tokens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Token Credits Used</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {Number(summary?.totalTokens || 0).toLocaleString()}
            <span className="text-xs text-slate-400 font-normal ml-1">tokens</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
            <span>In: <strong className="text-slate-300 font-mono">{Number(summary?.promptTokens || 0).toLocaleString()}</strong></span>
            <span>•</span>
            <span>Out: <strong className="text-slate-300 font-mono">{Number(summary?.completionTokens || 0).toLocaleString()}</strong></span>
          </p>
        </div>

        {/* Metric 3: Total Analyses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Diagnoses Run</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {Number(summary?.totalAnalyses || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Single error events & batch summaries
          </p>
        </div>

        {/* Metric 4: Active Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Engine</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-lg font-bold text-white truncate" title={activeModelObj.name}>
            {activeModelObj.name}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase font-mono">
              {activeProvider === 'gemini' ? 'Google Gemini' : 'AWS Bedrock'}
            </span>
            <span className="text-slate-400 font-mono">
              {activeModelObj.inputRatePer1M ? `$${activeModelObj.inputRatePer1M}/1M` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Test Result Toast/Banner */}
      {testResult && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs animate-fade-in ${
          testResult.success 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span className="font-medium">{testResult.message}</span>
        </div>
      )}

      {/* Configured AI Keys & Credentials Keep Box (Matched with Manage Log Locations) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Stored AI Keys & Credentials Keep Box</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {(config?.hasGeminiKey ? 1 : 0) + (config?.hasAwsCreds ? 1 : 0)} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Securely retained credentials in <code className="text-amber-300 font-mono">config.json</code> for zero-setup automated analyses
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/40 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Keep Box</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Google Gemini Key Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white text-sm">Google Gemini</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {config?.provider === 'gemini' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Active
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    config?.hasGeminiKey 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {config?.hasGeminiKey ? 'Key Stored' : 'No Key'}
                  </span>
                </div>
              </div>

              {/* Stored Key Row */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                  <code className="text-xs font-mono text-amber-300 truncate">
                    {showGeminiKey && config?.geminiApiKey 
                      ? config.geminiApiKey 
                      : (config?.maskedGeminiKey || (config?.hasGeminiKey ? '••••••••••••••••••••••••' : 'No Key Configured'))}
                  </code>
                </div>

                {config?.geminiApiKey && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      title={showGeminiKey ? 'Hide key' : 'Show full key'}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyKeyToClipboard(config.geminiApiKey)}
                      title="Copy key"
                      className="p-1 rounded text-slate-400 hover:text-amber-400 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Model: <strong className="text-slate-200 font-mono">{config?.geminiModel || 'gemini-3.8-flash'}</strong></span>
              {config?.hasGeminiKey && (
                <button
                  onClick={() => handleTestConnection('gemini')}
                  disabled={testingProvider === 'gemini'}
                  className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3 h-3 ${testingProvider === 'gemini' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'gemini' ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: AWS Bedrock Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-white text-sm">AWS Bedrock Runtime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {config?.provider === 'bedrock' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Active
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    {config?.hasAwsCreds ? 'Keys Set' : 'Default Chain'}
                  </span>
                </div>
              </div>

              {/* Status / Region Row */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">
                    {config?.awsAccessKeyId ? `Key: ${config.awsAccessKeyId}` : 'IAM Profile / Env Chain'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {config?.bedrockRegion || 'us-east-1'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[170px]" title={config?.bedrockModel}>
                Model: <strong className="text-slate-200 font-mono">{config?.bedrockModel?.split(':')?.[0]?.replace('anthropic.', '') || 'Claude 3.5'}</strong>
              </span>
              <button
                onClick={() => handleTestConnection('bedrock')}
                disabled={testingProvider === 'bedrock'}
                className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Zap className={`w-3 h-3 ${testingProvider === 'bedrock' ? 'animate-spin' : ''}`} />
                <span>{testingProvider === 'bedrock' ? 'Testing...' : 'Test Bedrock'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Model Selector & Pricing Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Model Roster & Dynamic Selector</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any model below to immediately switch the operational AI engine for future CloudTrail diagnoses
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Currently Active: <strong className="text-amber-400">{activeModelObj.name}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeModels.map(m => {
            const isActive = m.id === activeModelId;
            const isSwitching = switchingModel === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm">{m.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {m.provider}
                      </span>
                      {m.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          m.recommended 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 min-h-[32px]">
                    {m.description}
                  </p>

                  {/* Rate Card Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 mb-3 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Prompt (Input)</span>
                      <strong className="text-slate-200">${m.inputRatePer1M}</strong>
                      <span className="text-slate-400 text-[10px]"> / 1M</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Output (Completion)</span>
                      <strong className="text-slate-200">${m.outputRatePer1M}</strong>
                      <span className="text-slate-400 text-[10px]"> / 1M</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Window: <strong className="text-slate-300">{m.contextWindow}</strong>
                  </span>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <Check className="w-3.5 h-3.5" />
                      Active Model
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelectModel(m)}
                      disabled={isSwitching}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSwitching ? 'Switching...' : 'Select Model'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Activity Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>AI Analysis Audit Trail & Transaction Logs</span>
            </h3>
            <p className="text-xs text-slate-400">
              Granular record of token counts, latency, and actual micro-spend for each diagnostic execution
            </p>
          </div>

          {recentLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Usage History</span>
            </button>
          )}
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Bot className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-slate-400 font-medium">No AI diagnoses performed yet</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Open any failed event row in the Event Explorer table and click "AI Error Diagnosis" to see automated root-cause analysis and live cost tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-medium">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action / Event</th>
                  <th className="px-4 py-3">Error Code</th>
                  <th className="px-4 py-3">Engine & Model</th>
                  <th className="px-4 py-3 text-right">Tokens (In / Out)</th>
                  <th className="px-4 py-3 text-right">Latency</th>
                  <th className="px-4 py-3 text-right">Estimated Cost</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {recentLogs.map((log) => {
                  let dateStr = 'N/A';
                  try {
                    dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                  } catch {
                    dateStr = 'N/A';
                  }
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-sans">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                        {log.eventName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-rose-300 whitespace-nowrap">
                        {log.errorCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-sans">
                        <span className="font-mono text-amber-300">{log.model || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({log.provider || 'ai'})</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 whitespace-nowrap">
                        <span className="text-white font-bold">{Number(log.totalTokens || 0).toLocaleString()}</span>
                        <span className="text-slate-400 ml-1">({Number(log.promptTokens || 0).toLocaleString()} / {Number(log.completionTokens || 0).toLocaleString()})</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                        {log.latencyMs ?? 0}ms
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                        ${Number(log.costUSD || 0).toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {log.success ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-rose-500/10 text-rose-400 border border-rose-500/30" title={log.errorMsg}>
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
