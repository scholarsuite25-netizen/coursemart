import React, { useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  Code,
  Copy,
  Download,
  FileCode,
  FileDown,
  FileText,
  Film,
  Info,
  Layers,
  MoveDown,
  MoveUp,
  Plus,
  Printer,
  Save,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type { DocumentTutorial, TutorialStep } from '../../types/tutorial';
import {
  createLocalTutorialDraft,
  formatTutorialAsHtml,
  formatTutorialAsJson,
  formatTutorialAsMarkdown,
} from '../../utils/tutorialCreator';

interface TutorialEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTutorial?: DocumentTutorial | null;
  onSave: (tutorial: DocumentTutorial) => void;
  onPreviewVideo?: (tutorial: DocumentTutorial) => void;
}

export const TutorialEditorModal: React.FC<TutorialEditorModalProps> = ({
  isOpen,
  onClose,
  initialTutorial,
  onSave,
  onPreviewVideo,
}) => {
  const [tutorial, setTutorial] = useState<DocumentTutorial>(() =>
    initialTutorial || createLocalTutorialDraft({
      title: 'New Engineering Tutorial',
      description: 'Comprehensive step-by-step technical guide.',
      authorName: 'Platform Lead',
    })
  );

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [tagsInput, setTagsInput] = useState<string>((tutorial.tags || []).join(', '));
  const [checklistInput, setChecklistInput] = useState<string>('');

  if (!isOpen) return null;

  const currentStep = tutorial.steps[activeStepIndex] || tutorial.steps[0] || {
    stepNumber: 1,
    title: 'Initial Step',
    description: '',
  };

  const handleUpdateStep = (updatedFields: Partial<TutorialStep>) => {
    setTutorial((prev) => {
      const newSteps = [...prev.steps];
      const index = activeStepIndex;
      newSteps[index] = { ...newSteps[index], ...updatedFields };
      return { ...prev, steps: newSteps, updatedAt: new Date().toISOString() };
    });
  };

  const handleAddStep = () => {
    setTutorial((prev) => {
      const nextNum = prev.steps.length + 1;
      const newStep: TutorialStep = {
        id: `step-${Date.now()}-${nextNum}`,
        stepNumber: nextNum,
        title: `Step ${nextNum}: New Procedure`,
        description: 'Provide detailed step explanations and code implementations.',
        codeLanguage: 'ts',
        checklist: [],
      };
      return {
        ...prev,
        steps: [...prev.steps, newStep],
        updatedAt: new Date().toISOString(),
      };
    });
    setActiveStepIndex(tutorial.steps.length);
  };

  const handleDeleteStep = (indexToDelete: number) => {
    if (tutorial.steps.length <= 1) return;
    setTutorial((prev) => {
      const filtered = prev.steps
        .filter((_, idx) => idx !== indexToDelete)
        .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
      return { ...prev, steps: filtered, updatedAt: new Date().toISOString() };
    });
    setActiveStepIndex((prev) => Math.max(0, Math.min(prev, tutorial.steps.length - 2)));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tutorial.steps.length) return;

    setTutorial((prev) => {
      const newSteps = [...prev.steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[targetIndex];
      newSteps[targetIndex] = temp;
      const renumbered = newSteps.map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered, updatedAt: new Date().toISOString() };
    });
    setActiveStepIndex(targetIndex);
  };

  const handleDuplicateStep = (index: number) => {
    const stepToCopy = tutorial.steps[index];
    if (!stepToCopy) return;

    setTutorial((prev) => {
      const newSteps = [...prev.steps];
      const duplicated: TutorialStep = {
        ...stepToCopy,
        id: `step-${Date.now()}`,
        title: `${stepToCopy.title} (Copy)`,
      };
      newSteps.splice(index + 1, 0, duplicated);
      const renumbered = newSteps.map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered, updatedAt: new Date().toISOString() };
    });
    setActiveStepIndex(index + 1);
  };

  const handleAddChecklistItem = () => {
    if (!checklistInput.trim()) return;
    const currentList = currentStep.checklist || [];
    handleUpdateStep({ checklist: [...currentList, checklistInput.trim()] });
    setChecklistInput('');
  };

  const handleRemoveChecklistItem = (itemIndex: number) => {
    const currentList = currentStep.checklist || [];
    handleUpdateStep({ checklist: currentList.filter((_, i) => i !== itemIndex) });
  };

  const downloadTextFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = formatTutorialAsMarkdown(tutorial);
    downloadTextFile(md, `${tutorial.slug || 'tutorial'}.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportHtml = () => {
    const html = formatTutorialAsHtml(tutorial);
    downloadTextFile(html, `${tutorial.slug || 'tutorial'}.html`, 'text/html;charset=utf-8');
  };

  const handleExportJson = () => {
    const json = formatTutorialAsJson(tutorial);
    downloadTextFile(json, `${tutorial.slug || 'tutorial'}.json`, 'application/json;charset=utf-8');
  };

  const handlePrintPdf = () => {
    const html = formatTutorialAsHtml(tutorial);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } else {
      window.print();
    }
  };

  const handleSave = () => {
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: DocumentTutorial = {
      ...tutorial,
      tags: parsedTags.length > 0 ? parsedTags : ['General'],
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Document Tutorial & AI Video Studio
              </h2>
              <p className="text-xs text-slate-400">
                Author structured step-by-step masterclasses with automated Markdown, HTML, JSON, and Video narrator exports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" /> Save Tutorial
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Exporters */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Export Formats:</span>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 border border-slate-700 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-400" /> Markdown (.md)
            </button>
            <button
              type="button"
              onClick={handleExportHtml}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" /> HTML (.html)
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 border border-slate-700 transition"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" /> JSON (.json)
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" /> Print / PDF
            </button>
          </div>

          {onPreviewVideo && (
            <button
              type="button"
              onClick={() => onPreviewVideo(tutorial)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Film className="w-3.5 h-3.5" /> Preview AI Video Guide
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tutorial Title</label>
                <input
                  type="text"
                  value={tutorial.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    setTutorial((prev) => ({ ...prev, title, slug }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={tutorial.description}
                  onChange={(e) => setTutorial((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={tutorial.slug}
                  onChange={(e) => setTutorial((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={tutorial.difficulty || 'beginner'}
                    onChange={(e) => setTutorial((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Read Time (min)</label>
                  <input
                    type="number"
                    value={tutorial.readTimeMinutes || 5}
                    onChange={(e) =>
                      setTutorial((prev) => ({
                        ...prev,
                        readTimeMinutes: parseInt(e.target.value, 10) || 5,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Docker, TypeScript, Microservices"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Step Navigation Sidebar + Editor Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step List / Reordering Sidebar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Steps ({tutorial.steps.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {tutorial.steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      activeStepIndex === idx
                        ? 'bg-amber-500/15 border-amber-500/50 text-white font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="truncate flex-1">
                      {step.stepNumber}. {step.title}
                    </span>

                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:text-white disabled:opacity-30"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === tutorial.steps.length - 1}
                        className="p-1 hover:text-white disabled:opacity-30"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateStep(idx)}
                        className="p-1 hover:text-white"
                        title="Duplicate Step"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {tutorial.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(idx)}
                          className="p-1 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Step Content Editor */}
            <div className="md:col-span-3 space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Editing Step {currentStep.stepNumber}: {currentStep.title}
                </h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Step Title</label>
                <input
                  type="text"
                  value={currentStep.title}
                  onChange={(e) => handleUpdateStep({ title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Narration & Step Instructions
                </label>
                <textarea
                  rows={4}
                  value={currentStep.description || currentStep.content || ''}
                  onChange={(e) =>
                    handleUpdateStep({ description: e.target.value, content: e.target.value })
                  }
                  placeholder="Explain the technical concepts, design decisions, and commands..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* Code Snippet & Language Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-blue-400" /> Code Snippet (Optional)
                  </label>
                  <select
                    value={currentStep.codeLanguage || 'ts'}
                    onChange={(e) => handleUpdateStep({ codeLanguage: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value="ts">TypeScript / JavaScript</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="python">Python</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML / CSS</option>
                    <option value="sql">SQL / Postgres</option>
                  </select>
                </div>
                <textarea
                  rows={5}
                  value={currentStep.codeSnippet || ''}
                  onChange={(e) => handleUpdateStep({ codeSnippet: e.target.value })}
                  placeholder="// Paste or write your runnable code snippet here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Callout Note & Tone Selector */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Callout Tone</label>
                  <select
                    value={currentStep.calloutType || 'info'}
                    onChange={(e) => handleUpdateStep({ calloutType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="info">Info</option>
                    <option value="tip">Tip / Pro Tip</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Callout Note</label>
                  <input
                    type="text"
                    value={currentStep.calloutNote || ''}
                    onChange={(e) => handleUpdateStep({ calloutNote: e.target.value })}
                    placeholder="e.g. Ensure you set appropriate environment secrets in .env before running."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Checklist Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> Action Checklist
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Add actionable requirement..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl border border-slate-700 transition"
                  >
                    Add Task
                  </button>
                </div>

                {currentStep.checklist && currentStep.checklist.length > 0 && (
                  <div className="space-y-1">
                    {currentStep.checklist.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(i)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
