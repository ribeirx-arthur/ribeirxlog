'use client';

import React, { useState } from 'react';
import {
    DollarSign, Plus, Trash2, CreditCard, Home,
    Calculator, Wrench, User, ChevronDown, Save,
    CheckCircle2, AlertCircle, RefreshCcw
} from 'lucide-react';
import { MonthlyExpenseItem, UserProfile } from '../types';

interface FinancialContextEditorProps {
    profile: UserProfile;
    onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

const EXPENSE_CATEGORIES = [
    { value: 'debt', label: 'Dívida', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { value: 'fixed', label: 'Gasto Fixo', icon: Home, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { value: 'variable', label: 'Variável', icon: Wrench, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
] as const;

const EXPENSE_SUGGESTIONS = [
    { label: 'Financiamento caminhão', category: 'debt', amount: 0 },
    { label: 'Aluguel/Moradia', category: 'fixed', amount: 0 },
    { label: 'Contador', category: 'fixed', amount: 0 },
    { label: 'Internet/Plano celular', category: 'fixed', amount: 0 },
    { label: 'Seguro veículo', category: 'fixed', amount: 0 },
    { label: 'Empréstimo pessoal', category: 'debt', amount: 0 },
    { label: 'Combustível próprio (pessoal)', category: 'variable', amount: 0 },
    { label: 'Alimentação fora de casa', category: 'variable', amount: 0 },
];

export const FinancialContextEditor: React.FC<FinancialContextEditorProps> = ({ profile, onSave }) => {
    const [expenses, setExpenses] = useState<MonthlyExpenseItem[]>(profile.monthlyExpenses || []);
    const [personalNeeds, setPersonalNeeds] = useState(profile.personalMonthlyNeeds || 0);
    const [savingsGoal, setSavingsGoal] = useState(profile.savingsGoalPct || 0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState<'debt' | 'fixed' | 'variable'>('fixed');

    const totalDebt = expenses.filter(e => e.category === 'debt').reduce((a, e) => a + e.amount, 0);
    const totalFixed = expenses.filter(e => e.category === 'fixed').reduce((a, e) => a + e.amount, 0);
    const totalVariable = expenses.filter(e => e.category === 'variable').reduce((a, e) => a + e.amount, 0);
    const grandTotal = totalDebt + totalFixed + totalVariable + personalNeeds;

    const handleAddExpense = () => {
        if (!newLabel.trim() || !newAmount) return;
        setExpenses(prev => [...prev, {
            id: `exp-${Date.now()}`,
            label: newLabel.trim(),
            amount: parseFloat(newAmount),
            category: newCategory,
        }]);
        setNewLabel('');
        setNewAmount('');
    };

    const handleRemove = (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const handleAddSuggestion = (sug: typeof EXPENSE_SUGGESTIONS[0]) => {
        if (expenses.find(e => e.label === sug.label)) return;
        setExpenses(prev => [...prev, {
            id: `exp-${Date.now()}`,
            label: sug.label,
            amount: sug.amount,
            category: sug.category as any,
        }]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                monthlyExpenses: expenses,
                personalMonthlyNeeds: personalNeeds,
                savingsGoalPct: savingsGoal,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Contexto Financeiro Pessoal</h3>
                    <p className="text-slate-500 text-xs">Esses dados alimentam a IA para gerar conselhos e planos realistas.</p>
                </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sugestões rápidas</p>
                <div className="flex flex-wrap gap-2">
                    {EXPENSE_SUGGESTIONS.map((s, i) => {
                        const alreadyAdded = expenses.some(e => e.label === s.label);
                        return (
                            <button
                                key={i}
                                onClick={() => handleAddSuggestion(s)}
                                disabled={alreadyAdded}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all
                                    ${alreadyAdded
                                        ? 'bg-slate-800/30 border-slate-700 text-slate-600 cursor-default'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                {alreadyAdded ? '✓ ' : '+ '}{s.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Add New */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adicionar gasto/dívida</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                        placeholder="Ex: Financiamento do caminhão"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-600 focus:border-rose-500 outline-none"
                    />
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">R$</span>
                        <input
                            type="number"
                            value={newAmount}
                            onChange={e => setNewAmount(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                            placeholder="0,00"
                            className="w-36 bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:border-rose-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {EXPENSE_CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setNewCategory(cat.value)}
                                className={`px-3 py-3.5 rounded-2xl border text-[9px] font-black uppercase tracking-wider transition-all ${newCategory === cat.value ? cat.bg + ' ' + cat.color : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleAddExpense}
                        disabled={!newLabel.trim() || !newAmount}
                        className="flex items-center gap-2 px-5 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>
            </div>

            {/* List */}
            {expenses.length > 0 && (
                <div className="space-y-2">
                    {expenses.map(exp => {
                        const catConfig = EXPENSE_CATEGORIES.find(c => c.value === exp.category)!;
                        const Icon = catConfig.icon;
                        return (
                            <div key={exp.id} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${catConfig.bg} ${catConfig.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{exp.label}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${catConfig.color}`}>{catConfig.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={exp.amount}
                                        onChange={e => setExpenses(prev => prev.map(item => item.id === exp.id ? { ...item, amount: parseFloat(e.target.value) || 0 } : item))}
                                        className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white text-right outline-none focus:border-rose-500"
                                    />
                                    <button onClick={() => handleRemove(exp.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {expenses.length === 0 && (
                <div className="py-10 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Nenhum gasto adicionado.</p>
                    <p className="text-[10px] mt-1">Sem esses dados a IA não consegue dar conselhos financeiros precisos.</p>
                </div>
            )}

            {/* Personal Needs + Savings Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pró-labore mínimo</p>
                    </div>
                    <p className="text-xs text-slate-500">Quanto você PRECISA retirar pessoalmente por mês para se sustentar?</p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">R$</span>
                        <input
                            type="number"
                            value={personalNeeds || ''}
                            onChange={e => setPersonalNeeds(parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 3000"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-white placeholder-slate-600 outline-none focus:border-amber-500"
                        />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta de poupança mensal</p>
                    </div>
                    <p className="text-xs text-slate-500">Que % do lucro líquido você quer guardar todo mês?</p>
                    <div className="relative">
                        <input
                            type="number"
                            value={savingsGoal || ''}
                            onChange={e => setSavingsGoal(parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 20"
                            max={100}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-10 py-4 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                    </div>
                </div>
            </div>

            {/* Summary */}
            {expenses.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumo do Contexto</p>
                    <div className="space-y-2 text-xs">
                        {totalDebt > 0 && <div className="flex justify-between text-slate-400"><span>Dívidas mensais</span><span className="text-rose-400 font-black">{fmt(totalDebt)}</span></div>}
                        {totalFixed > 0 && <div className="flex justify-between text-slate-400"><span>Gastos fixos</span><span className="text-amber-400 font-black">{fmt(totalFixed)}</span></div>}
                        {totalVariable > 0 && <div className="flex justify-between text-slate-400"><span>Gastos variáveis</span><span className="text-sky-400 font-black">{fmt(totalVariable)}</span></div>}
                        {personalNeeds > 0 && <div className="flex justify-between text-slate-400"><span>Pró-labore mínimo</span><span className="text-amber-400 font-black">{fmt(personalNeeds)}</span></div>}
                        <div className="flex justify-between text-white font-black pt-2 border-t border-slate-800">
                            <span>Total Compromissos / mês</span>
                            <span className="text-rose-400">{fmt(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 py-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all"
            >
                {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando...' : saved ? 'Contexto Salvo! ✓' : 'Salvar Contexto Financeiro'}
            </button>
        </div>
    );
};

export default FinancialContextEditor;
