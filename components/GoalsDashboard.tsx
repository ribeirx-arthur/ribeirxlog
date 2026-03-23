'use client';

import React, { useState, useCallback } from 'react';
import {
    Target, Plus, ChevronRight, CheckCircle2, Circle, Brain,
    Sparkles, Flag, TrendingUp, Wallet, Truck, User,
    ChevronDown, Trophy, Rocket, Clock, ArrowRight,
    Star, Zap, MessageSquare, RefreshCcw, Lock, CheckCheck,
    AlertCircle, X, CornerDownRight
} from 'lucide-react';
import { Goal, GoalStep, GoalCategory, UserProfile, Trip, Vehicle, Driver } from '../types';

interface GoalsDashboardProps {
    goals: Goal[];
    profile: UserProfile;
    trips: Trip[];
    vehicles: Vehicle[];
    drivers: Driver[];
    onCreateGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentStepIndex' | 'status'>) => Promise<Goal>;
    onUpdateGoal: (goal: Goal) => Promise<void>;
    onDeleteGoal: (goalId: string) => Promise<void>;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: React.FC<any>; color: string; bg: string }> = {
    business: { label: 'Negócio', icon: Rocket, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    financial: { label: 'Financeiro', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    fleet: { label: 'Frota', icon: Truck, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    personal: { label: 'Pessoal', icon: User, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const GOAL_TEMPLATES = [
    { title: 'Abrir minha Transportadora', description: 'Formalizar meu negócio logístico como empresa', category: 'business' as GoalCategory },
    { title: 'Comprar meu próprio caminhão', description: 'Economizar e financiar meu próximo veículo', category: 'fleet' as GoalCategory },
    { title: 'Atingir R$ 10.000 de lucro mensal', description: 'Aumentar minha margem e faturamento', category: 'financial' as GoalCategory },
    { title: 'Registrar minha empresa no ANTT', description: 'Regularizar a transportadora junto ao órgão regulador', category: 'business' as GoalCategory },
];

export const GoalsDashboard: React.FC<GoalsDashboardProps> = ({
    goals, profile, trips, vehicles, drivers, onCreateGoal, onUpdateGoal, onDeleteGoal
}) => {
    const [activeGoalId, setActiveGoalId] = useState<string | null>(goals[0]?.id || null);
    const [showNewGoalForm, setShowNewGoalForm] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDesc, setNewGoalDesc] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('business');
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [coachMessage, setCoachMessage] = useState<string | null>(null);
    const [completingStep, setCompletingStep] = useState<string | null>(null);
    const [stepNote, setStepNote] = useState('');
    const [loadingCoach, setLoadingCoach] = useState(false);

    const activeGoal = goals.find(g => g.id === activeGoalId) || null;
    const completedSteps = activeGoal?.steps.filter(s => s.completed).length || 0;
    const totalSteps = activeGoal?.steps.length || 0;
    const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const financialSummary = `Faturamento médio: R$ ${(trips.reduce((a, t) => a + t.freteSeco, 0) / (trips.length || 1)).toFixed(0)}/viagem. Total de ${trips.length} viagens. ${vehicles.length} veículo(s). ${drivers.length} motorista(s).`;

    const handleCreateGoal = useCallback(async () => {
        if (!newGoalTitle.trim()) return;
        setGeneratingPlan(true);
        try {
            const resp = await fetch('/api/ai/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_plan',
                    goalTitle: newGoalTitle,
                    goalDescription: newGoalDesc,
                    // Dados brutos completos — a API calculará tudo
                    trips,
                    vehicles,
                    drivers,
                    profile,
                })
            });
            const data = await resp.json();

            if (!resp.ok || data.error) {
                alert(data.error || 'Erro ao gerar meta com IA. Tente novamente.');
                return;
            }

            const rawSteps: GoalStep[] = (data.steps || []).map((s: any, idx: number) => ({
                id: `step-${Date.now()}-${idx}`,
                goalId: '',
                order: s.order || idx + 1,
                title: s.title,
                description: s.description,
                actionTip: s.actionTip,
                estimatedValue: s.estimatedValue,
                completed: false,
            }));

            const newGoal = await onCreateGoal({
                title: newGoalTitle,
                description: newGoalDesc,
                category: newGoalCategory,
                steps: rawSteps,
                aiContext: data.summary || '',
            });

            setActiveGoalId(newGoal.id);
            setShowNewGoalForm(false);
            setNewGoalTitle('');
            setNewGoalDesc('');
        } catch (e) {
            console.error('Erro ao criar meta:', e);
        } finally {
            setGeneratingPlan(false);
        }
    }, [newGoalTitle, newGoalDesc, newGoalCategory, financialSummary, onCreateGoal, trips, vehicles, drivers, profile]);

    const handleCompleteStep = useCallback(async (step: GoalStep) => {
        if (!activeGoal) return;
        setLoadingCoach(true);
        try {
            // Coach message
            const coachResp = await fetch('/api/ai/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'coach_advance',
                    goalTitle: activeGoal.title,
                    currentStep: step,
                    userNote: stepNote,
                })
            });
            const coachData = await coachResp.json();
            setCoachMessage(coachData.message || null);

            // Update goal steps
            const updatedSteps = activeGoal.steps.map(s =>
                s.id === step.id ? { ...s, completed: true, completedAt: new Date().toISOString(), notesFromUser: stepNote } : s
            );
            const nextIdx = updatedSteps.findIndex(s => !s.completed);
            await onUpdateGoal({
                ...activeGoal,
                steps: updatedSteps,
                currentStepIndex: nextIdx >= 0 ? nextIdx : activeGoal.currentStepIndex,
                status: updatedSteps.every(s => s.completed) ? 'completed' : 'active',
                updatedAt: new Date().toISOString(),
            });
            setCompletingStep(null);
            setStepNote('');
        } catch (e) {
            console.error('Erro ao completar passo:', e);
        } finally {
            setLoadingCoach(false);
        }
    }, [activeGoal, stepNote, onUpdateGoal]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-24">

            {/* ─── LEFT: Goal List ─── */}
            <aside className="lg:w-80 shrink-0 space-y-4">
                <div className="bg-gradient-to-br from-indigo-600/10 to-slate-900 border border-indigo-500/20 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter">Minhas Metas</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Coach IA Personalizado</p>
                        </div>
                    </div>
                </div>

                {/* Goals list */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 space-y-2">
                    {goals.map(goal => {
                        const CatIcon = CATEGORY_CONFIG[goal.category].icon;
                        const pct = goal.steps.length > 0 ? Math.round((goal.steps.filter(s => s.completed).length / goal.steps.length) * 100) : 0;
                        const isActive = activeGoalId === goal.id;
                        return (
                            <button
                                key={goal.id}
                                onClick={() => setActiveGoalId(goal.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${isActive
                                    ? 'bg-indigo-600/10 border border-indigo-500/20'
                                    : 'hover:bg-slate-800/50 border border-transparent'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${CATEGORY_CONFIG[goal.category].bg} ${CATEGORY_CONFIG[goal.category].color}`}>
                                    <CatIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-white truncate">{goal.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-black shrink-0">{pct}%</span>
                                    </div>
                                </div>
                                {goal.status === 'completed' && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
                            </button>
                        );
                    })}

                    {goals.length === 0 && (
                        <div className="py-8 text-center text-slate-500">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs font-bold">Nenhuma meta ainda.</p>
                            <p className="text-[10px]">Crie sua primeira meta abaixo!</p>
                        </div>
                    )}
                </div>

                {/* New Goal Button */}
                <button
                    onClick={() => setShowNewGoalForm(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nova Meta com IA
                </button>
            </aside>

            {/* ─── RIGHT: Active Goal Detail ─── */}
            <main className="flex-1 min-w-0 space-y-6">
                {/* NEW GOAL FORM */}
                {showNewGoalForm && (
                    <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Defina sua Meta</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">A IA vai montar o plano completo pra você</p>
                                </div>
                            </div>
                            <button onClick={() => setShowNewGoalForm(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Templates */}
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Escolha um modelo ou crie do zero</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {GOAL_TEMPLATES.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setNewGoalTitle(t.title); setNewGoalDesc(t.description); setNewGoalCategory(t.category); }}
                                        className={`text-left p-4 rounded-2xl border transition-all text-xs font-bold ${newGoalTitle === t.title ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                                    >
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Título da meta *</label>
                                <input
                                    value={newGoalTitle}
                                    onChange={e => setNewGoalTitle(e.target.value)}
                                    placeholder="Ex: Abrir minha transportadora LTDA"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contexto adicional (opcional)</label>
                                <textarea
                                    value={newGoalDesc}
                                    onChange={e => setNewGoalDesc(e.target.value)}
                                    placeholder="Ex: Tenho 2 caminhões, já faturei R$8k este mês..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Categoria</label>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map(cat => {
                                        const cfg = CATEGORY_CONFIG[cat];
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setNewGoalCategory(cat)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all ${newGoalCategory === cat ? cfg.bg + ' ' + cfg.color : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateGoal}
                            disabled={!newGoalTitle.trim() || generatingPlan}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all"
                        >
                            {generatingPlan ? (
                                <><RefreshCcw className="w-4 h-4 animate-spin" /> Gemini Criando seu Plano...</>
                            ) : (
                                <><Brain className="w-4 h-4" /> Gerar Plano Completo com IA</>
                            )}
                        </button>
                    </div>
                )}

                {/* ACTIVE GOAL VIEW */}
                {activeGoal && !showNewGoalForm && (
                    <>
                        {/* Header + Progress */}
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${CATEGORY_CONFIG[activeGoal.category].bg} ${CATEGORY_CONFIG[activeGoal.category].color}`}>
                                            {CATEGORY_CONFIG[activeGoal.category].label}
                                        </span>
                                        {activeGoal.status === 'completed' && (
                                            <span className="text-[9px] font-black px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest">
                                                ✓ Concluída!
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                        {activeGoal.title}
                                    </h3>
                                    {activeGoal.aiContext && (
                                        <p className="text-slate-500 text-sm italic leading-relaxed">"{activeGoal.aiContext}"</p>
                                    )}
                                </div>
                                <div className="shrink-0 flex flex-col items-center gap-1">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-20 h-20 transform -rotate-90">
                                            <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="6" />
                                            <circle
                                                cx="40" cy="40" r="34"
                                                fill="none"
                                                stroke={progressPct === 100 ? '#f59e0b' : '#6366f1'}
                                                strokeWidth="6"
                                                strokeDasharray={`${2 * Math.PI * 34}`}
                                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-black text-white">{progressPct}%</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {completedSteps}/{totalSteps} passos
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${progressPct}%`,
                                        background: progressPct === 100
                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            : 'linear-gradient(90deg, #6366f1, #818cf8)'
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <CheckCheck className="w-3 h-3 text-emerald-500" />
                                    <span>{completedSteps} concluídos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-indigo-400" />
                                    <span>{totalSteps - completedSteps} restantes</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Coach Message */}
                        {coachMessage && (
                            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-6 flex items-start gap-4 animate-in slide-in-from-bottom duration-500">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 animate-bounce">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Coach Gemini</p>
                                    <p className="text-slate-300 text-sm leading-relaxed italic">"{coachMessage}"</p>
                                </div>
                                <button onClick={() => setCoachMessage(null)} className="ml-auto text-slate-600 hover:text-white shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Steps List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 px-2">
                                <Flag className="w-4 h-4 text-indigo-400" />
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Plano de Ação</h4>
                            </div>

                            {activeGoal.steps.map((step, idx) => {
                                const isCurrent = !step.completed && activeGoal.steps.slice(0, idx).every(s => s.completed);
                                const isLocked = !step.completed && !isCurrent;
                                const isCompleting = completingStep === step.id;

                                return (
                                    <div
                                        key={step.id}
                                        className={`rounded-[2rem] border transition-all overflow-hidden
                                            ${step.completed ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                isCurrent ? 'bg-indigo-600/5 border-indigo-500/30 shadow-lg shadow-indigo-500/10' :
                                                    'bg-slate-900/50 border-slate-800/50 opacity-60'}`}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Step Icon */}
                                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                                                    ${step.completed ? 'bg-emerald-500 text-white' :
                                                        isCurrent ? 'bg-indigo-600 text-white animate-pulse' :
                                                            'bg-slate-800 text-slate-600'}`}>
                                                    {step.completed ? <CheckCircle2 className="w-5 h-5" /> :
                                                        isLocked ? <Lock className="w-4 h-4" /> :
                                                            <span className="text-sm font-black">{idx + 1}</span>}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h5 className={`text-sm font-black ${step.completed ? 'text-emerald-400 line-through' : isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                                            {step.title}
                                                        </h5>
                                                        {isCurrent && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wider animate-pulse">
                                                                Próximo passo
                                                            </span>
                                                        )}
                                                        {step.estimatedValue && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                                                                R$ {step.estimatedValue.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs leading-relaxed mt-1 ${step.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        {step.description}
                                                    </p>

                                                    {/* Action tip */}
                                                    {(isCurrent || step.completed) && step.actionTip && (
                                                        <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl border ${step.completed ? 'bg-slate-900/50 border-slate-800' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                                            <Zap className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${step.completed ? 'text-slate-600' : 'text-amber-400'}`} />
                                                            <p className={`text-[11px] leading-relaxed ${step.completed ? 'text-slate-600' : 'text-amber-300'}`}>
                                                                {step.actionTip}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Completed note */}
                                                    {step.completed && step.notesFromUser && (
                                                        <div className="mt-2 flex items-start gap-2">
                                                            <CornerDownRight className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-slate-600 italic">"{step.notesFromUser}"</p>
                                                        </div>
                                                    )}

                                                    {/* Mark complete form */}
                                                    {isCurrent && !isCompleting && (
                                                        <button
                                                            onClick={() => setCompletingStep(step.id)}
                                                            className="mt-4 flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Marcar como Concluído
                                                        </button>
                                                    )}

                                                    {isCompleting && (
                                                        <div className="mt-4 space-y-3 animate-in slide-in-from-bottom duration-300">
                                                            <textarea
                                                                value={stepNote}
                                                                onChange={e => setStepNote(e.target.value)}
                                                                placeholder="Observação (opcional): como foi? dificuldades? valor real gasto?"
                                                                rows={2}
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none resize-none"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => handleCompleteStep(step)}
                                                                    disabled={loadingCoach}
                                                                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    {loadingCoach ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                    {loadingCoach ? 'Notificando Coach...' : 'Confirmar'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setCompletingStep(null)}
                                                                    className="text-slate-500 hover:text-white text-xs font-bold transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completed 🎉 */}
                        {activeGoal.status === 'completed' && (
                            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-4">
                                <div className="text-6xl">🏆</div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Meta Conquistada!</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                                    Você completou todos os passos de "<strong className="text-white">{activeGoal.title}</strong>". O que era um sonho agora é realidade!
                                </p>
                                <button
                                    onClick={() => setShowNewGoalForm(true)}
                                    className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full font-black text-sm uppercase tracking-widest transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Definir próxima Meta
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* EMPTY STATE */}
                {!activeGoal && !showNewGoalForm && (
                    <div className="py-20 flex flex-col items-center text-center gap-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-[3rem]">
                        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center">
                            <Target className="w-10 h-10 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Qual é o seu próximo sonho?</h4>
                            <p className="text-slate-500 text-sm mt-2 max-w-md">
                                A IA vai criar um plano passo a passo personalizado. Desde abrir sua transportadora até comprar sua frota própria.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewGoalForm(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Criar minha primeira Meta
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GoalsDashboard;
