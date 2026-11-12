import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  X, 
  Sparkles, 
  Key, 
  Shield, 
  Check, 
  AlertTriangle, 
  Server, 
  Cpu, 
  Zap, 
  DollarSign, 
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  Plus,
  ExternalLink
} from 'lucide-react';

export default function AISettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'gemini' | 'bedrock'
  const [config, setConfig] = useState({
    provider: 'gemini',
    geminiModel: 'gemini-3.8-flash',
    bedrockModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    bedrockRegion: 'us-east-1',
    geminiApiKey: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: ''
  });
  const [serverConfig, setServerConfig] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null); // 'gemini' | 'bedrock' | null
  const [testResult, setTestResult] = useState(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [confData, modelData] = await Promise.all([
        api.getAIConfig(),
        api.getAIModels()
      ]);
      setServerConfig(confData);
      setModels(modelData.models || []);
      setConfig({
        provider: confData.provider || 'gemini',
        geminiModel: confData.geminiModel || 'gemini-3.8-flash',
        bedrockModel: confData.bedrockModel || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        bedrockRegion: confData.bedrockRegion || 'us-east-1',
        geminiApiKey: confData.geminiApiKey || '',
        awsAccessKeyId: '',
        awsSecretAccessKey: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGemini = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        provider: 'gemini',
        geminiModel: config.geminiModel,
        geminiApiKey: config.geminiApiKey.trim()
      };
      await api.updateAIConfig(payload);
      setSuccessMsg('Google Gemini API Key saved to Keep Box successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onConfigSaved) onConfigSaved();
      await loadData();
      setActiveTab('active');
    } catch (err) {
      setError(err.message || 'Failed to save Gemini key');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBedrock = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        provider: 'bedrock',
        bedrockModel: config.bedrockModel,
        bedrockRegion: config.bedrockRegion.trim()
      };
      if (config.awsAccessKeyId.trim()) payload.awsAccessKeyId = config.awsAccessKeyId.trim();
      if (config.awsSecretAccessKey.trim()) payload.awsSecretAccessKey = config.awsSecretAccessKey.trim();

      await api.updateAIConfig(payload);
      setSuccessMsg('AWS Bedrock settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onConfigSaved) onConfigSaved();
      await loadData();
      setActiveTab('active');
    } catch (err) {
      setError(err.message || 'Failed to save Bedrock configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchActiveProvider = async (provider) => {
    try {
      await api.updateAIConfig({ provider });
      setSuccessMsg(`Switched default AI provider to ${provider === 'gemini' ? 'Google Gemini' : 'AWS Bedrock'}.`);
      setTimeout(() => setSuccessMsg(null), 2500);
      if (onConfigSaved) onConfigSaved();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestConnection = async (providerToTest) => {
    setTesting(providerToTest);
    setTestResult(null);
    setError(null);
    try {
      const res = await api.testAIConnection({
        provider: providerToTest,
        geminiApiKey: providerToTest === 'gemini' ? (config.geminiApiKey || serverConfig?.geminiApiKey) : undefined,
        bedrockRegion: config.bedrockRegion,
        modelId: providerToTest === 'gemini' ? config.geminiModel : config.bedrockModel
      });
      setTestResult({
        provider: providerToTest,
        success: true,
        message: res.message || 'Connection successful!'
      });
    } catch (err) {
      setTestResult({
        provider: providerToTest,
        success: false,
        message: err.message || 'Connection failed'
      });
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = async (providerToDelete) => {
    if (!window.confirm(`Are you sure you want to remove the saved ${providerToDelete.toUpperCase()} API key/credentials from your Keep Box?`)) {
      return;
    }
    try {
      await api.deleteAIKey(providerToDelete);
      setSuccessMsg(`${providerToDelete.toUpperCase()} credentials removed from Keep Box.`);
      setTimeout(() => setSuccessMsg(null), 2500);
      if (onConfigSaved) onConfigSaved();
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to remove credentials');
    }
  };

  const copyKeyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  const hasGemini = !!(serverConfig?.hasGeminiKey);
  const hasBedrock = !!(serverConfig?.hasAwsCreds);
  const activeCount = (hasGemini ? 1 : 0) + (hasBedrock ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Manage AI API Keys & Credentials
              </h2>
              <p className="text-xs text-slate-400">Keep box for Google Gemini API keys and AWS Bedrock runtime credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (styled identically to Manage Log Locations) */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            onClick={() => { setActiveTab('active'); setError(null); setSuccessMsg(null); setTestResult(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Active Keys & Keep Box ({activeCount})</span>
          </button>
          <button
            onClick={() => { setActiveTab('gemini'); setError(null); setSuccessMsg(null); setTestResult(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gemini'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add / Edit Gemini Key</span>
          </button>
          <button
            onClick={() => { setActiveTab('bedrock'); setError(null); setSuccessMsg(null); setTestResult(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bedrock'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Configure AWS Bedrock</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-fade-in ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <strong className="block font-semibold mb-0.5">
                  {testResult.provider === 'gemini' ? 'Google Gemini Test' : 'AWS Bedrock Test'}: {testResult.success ? 'Verified' : 'Failed'}
                </strong>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}

          {/* TAB 1: ACTIVE CREDENTIALS KEEP BOX (Matched with LocationsModal.jsx) */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Stored AI Credentials in your Keep Box:</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  Default Engine: <strong className="uppercase">{serverConfig?.provider || 'gemini'}</strong>
                </span>
              </div>

              {/* CARD 1: GOOGLE GEMINI API KEY KEEP BOX */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">Google Gemini API</span>
                        {serverConfig?.provider === 'gemini' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Active Default
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          hasGemini 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {hasGemini ? 'Key Stored' : 'No Key'}
                        </span>
                        {serverConfig?.geminiKeySource && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                            {serverConfig.geminiKeySource === 'saved_config' ? 'config.json' : '.env file'}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Model: <strong className="text-slate-200 font-mono">{serverConfig?.geminiModel || 'gemini-3.8-flash'}</strong></span>
                        <span>•</span>
                        <span>Context: <strong className="text-slate-300">1M Tokens</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {hasGemini && (
                      <button
                        onClick={() => handleTestConnection('gemini')}
                        disabled={testing === 'gemini'}
                        title="Test live connection to Gemini"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 text-amber-400 ${testing === 'gemini' ? 'animate-spin' : ''}`} />
                        <span>{testing === 'gemini' ? 'Testing...' : 'Test Key'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('gemini')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all cursor-pointer text-[11px]"
                    >
                      {hasGemini ? 'Edit' : 'Add Key'}
                    </button>

                    {hasGemini && serverConfig?.geminiKeySource === 'saved_config' && (
                      <button
                        onClick={() => handleDeleteKey('gemini')}
                        title="Remove Gemini Key from Keep Box"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Visible Stored Key Box */}
                {hasGemini ? (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Stored Gemini Key:</span>
                        <code className="text-xs font-mono text-amber-300 truncate block">
                          {showGeminiKey && serverConfig?.geminiApiKey 
                            ? serverConfig.geminiApiKey 
                            : (serverConfig?.maskedGeminiKey || '••••••••••••••••••••••••••••••••')}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {serverConfig?.geminiApiKey && (
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          title={showGeminiKey ? 'Hide key' : 'Show full key'}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {serverConfig?.geminiApiKey && (
                        <button
                          type="button"
                          onClick={() => copyKeyToClipboard(serverConfig.geminiApiKey)}
                          title="Copy key to clipboard"
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    No Gemini API key stored. Click "Add Key" to configure your Google Gemini key.
                  </div>
                )}
              </div>

              {/* CARD 2: AWS BEDROCK KEEP BOX */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 shrink-0 mt-0.5">
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">AWS Bedrock Runtime</span>
                        {serverConfig?.provider === 'bedrock' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Active Default
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          hasBedrock 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}>
                          {hasBedrock ? 'Custom Keys' : 'Default IAM Chain'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                          {serverConfig?.bedrockRegion || 'us-east-1'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Model: <strong className="text-slate-200 font-mono">{serverConfig?.bedrockModel?.split(':')?.[0] || 'Claude 3.5 Sonnet'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleTestConnection('bedrock')}
                      disabled={testing === 'bedrock'}
                      title="Test live connection to Bedrock"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 text-orange-400 ${testing === 'bedrock' ? 'animate-spin' : ''}`} />
                      <span>{testing === 'bedrock' ? 'Testing...' : 'Test Bedrock'}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('bedrock')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 transition-all cursor-pointer text-[11px]"
                    >
                      Configure
                    </button>

                    {serverConfig?.awsCredsSource === 'saved_config' && (
                      <button
                        onClick={() => handleDeleteKey('bedrock')}
                        title="Reset custom Bedrock credentials"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-orange-400" />
                    <span>
                      {serverConfig?.awsAccessKeyId 
                        ? `Stored Access Key: ${serverConfig.awsAccessKeyId}`
                        : 'Using environment AWS credentials or IAM instance profile.'}
                    </span>
                  </div>
                  {serverConfig?.provider !== 'bedrock' && (
                    <button
                      onClick={() => handleSwitchActiveProvider('bedrock')}
                      className="text-amber-400 hover:text-amber-300 font-medium text-[11px] underline cursor-pointer"
                    >
                      Set as Active Engine
                    </button>
                  )}
                  {serverConfig?.provider === 'bedrock' && (
                    <button
                      onClick={() => handleSwitchActiveProvider('gemini')}
                      className="text-amber-400 hover:text-amber-300 font-medium text-[11px] underline cursor-pointer"
                    >
                      Switch to Gemini
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT GEMINI KEY */}
          {activeTab === 'gemini' && (
            <form onSubmit={handleSaveGemini} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Store Google Gemini API Key in Keep Box</span>
                  </h3>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                  >
                    <span>Get Key from Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Select Gemini Model
                  </label>
                  <select
                    value={config.geminiModel}
                    onChange={(e) => setConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended - $0.075 / 1M in, $0.30 / 1M out)</option>
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Budget - $0.0375 / 1M in, $0.15 / 1M out)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center justify-between">
                    <span>Google Gemini API Key</span>
                    {config.geminiApiKey && (
                      <span className="text-[11px] text-emerald-400">
                        {config.geminiApiKey.length} characters
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      required
                      value={config.geminiApiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                      placeholder="Paste your Gemini API key here (e.g. AIzaSy... or AQ.Ab8...)"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your key will be securely saved into <code className="text-amber-300 font-mono">config.json</code> and kept ready for sub-second error diagnoses.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                  >
                    Back to Keep Box
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !config.geminiApiKey.trim()}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/10"
                  >
                    {saving ? 'Saving...' : 'Save to Keep Box'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: CONFIGURE AWS BEDROCK */}
          {activeTab === 'bedrock' && (
            <form onSubmit={handleSaveBedrock} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    <span>Configure AWS Bedrock Engine</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Bedrock Model
                    </label>
                    <select
                      value={config.bedrockModel}
                      onChange={(e) => setConfig(prev => ({ ...prev, bedrockModel: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="anthropic.claude-3-5-sonnet-20241022-v2:0">Claude 3.5 Sonnet v2 ($3.00 in / $15.00 out)</option>
                      <option value="amazon.nova-micro-v1:0">Amazon Nova Micro ($0.035 in / $0.14 out)</option>
                      <option value="amazon.titan-text-express-v1">Amazon Titan Express ($0.20 in / $0.60 out)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      AWS Region
                    </label>
                    <input
                      type="text"
                      value={config.bedrockRegion}
                      onChange={(e) => setConfig(prev => ({ ...prev, bedrockRegion: e.target.value }))}
                      placeholder="us-east-1"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 block">
                    Optional: Custom AWS IAM Access Keys (Leave blank to use default AWS credentials chain):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={config.awsAccessKeyId}
                      onChange={(e) => setConfig(prev => ({ ...prev, awsAccessKeyId: e.target.value }))}
                      placeholder="AWS_ACCESS_KEY_ID (optional)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <input
                      type="password"
                      value={config.awsSecretAccessKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, awsSecretAccessKey: e.target.value }))}
                      placeholder="AWS_SECRET_ACCESS_KEY (optional)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                  >
                    Back to Keep Box
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {saving ? 'Saving...' : 'Save Bedrock Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>AI Engine & Credentials Manager</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
