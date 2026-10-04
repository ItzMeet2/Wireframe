'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, Info } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [providerInfo, setProviderInfo] = useState<{
    hasAnthropicKey: boolean;
    hasOpenAiKey: boolean;
    activeProvider: string;
  }>({
    hasAnthropicKey: false,
    hasOpenAiKey: false,
    activeProvider: 'Loading...'
  });

  const [anthropicKeyInput, setAnthropicKeyInput] = useState('');
  const [openAiKeyInput, setOpenAiKeyInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setProviderInfo(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSaveKeys = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anthropicApiKey: anthropicKeyInput,
          openAiApiKey: openAiKeyInput
        })
      });
      const data = await res.json();
      setProviderInfo(data);
      setSaveSuccess(true);
      setAnthropicKeyInput('');
      setOpenAiKeyInput('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">AI Provider & Server Settings</h2>
              <span className="text-[11px] text-zinc-400">Manage AI provider credentials securely</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Security Notice */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-start gap-2.5 text-zinc-300">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Server-Side Only:</strong> API keys are maintained exclusively in server memory and environment variables. They are never stored in browser localStorage, cookies, or sent to client state.
            </p>
          </div>

          {/* Current Status */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Active Provider
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200">{providerInfo.activeProvider}</span>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                Ready
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1 pt-1">
              <div>Anthropic Claude Key: {providerInfo.hasAnthropicKey ? '✅ Configured' : '⚪ Not Set'}</div>
              <div>OpenAI GPT-4o Key: {providerInfo.hasOpenAiKey ? '✅ Configured' : '⚪ Not Set'}</div>
            </div>
          </div>

          {/* Key Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-zinc-300 block mb-1">Anthropic API Key (sk-ant-...)</label>
              <input
                type="password"
                placeholder={providerInfo.hasAnthropicKey ? '••••••••••••••••' : 'Enter Claude API key...'}
                value={anthropicKeyInput}
                onChange={(e) => setAnthropicKeyInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-750 rounded p-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-zinc-300 block mb-1">OpenAI API Key (sk-...)</label>
              <input
                type="password"
                placeholder={providerInfo.hasOpenAiKey ? '••••••••••••••••' : 'Enter OpenAI API key...'}
                value={openAiKeyInput}
                onChange={(e) => setOpenAiKeyInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-750 rounded p-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/40 rounded text-emerald-300 text-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Server keys updated successfully!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
            Close
          </button>
          <button
            onClick={handleSaveKeys}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Save Keys to Server
          </button>
        </div>
      </div>
    </div>
  );
}
