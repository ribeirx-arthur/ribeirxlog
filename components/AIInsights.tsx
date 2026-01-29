import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, UserCheck, ArrowRight, BrainCircuit, X, Lightbulb, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { AIInsight, GoldenTip, generateGoldenTips } from '../services/aiAnalysis';
import { Trip, Vehicle, Driver, Shipper } from '../types';

interface AIInsightsProps {
    insights: AIInsight[];
    trips?: Trip[];
    vehicles?: Vehicle[];
    shippers?: Shipper[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights, trips, vehicles, shippers }) => {
    const [showGoldenTips, setShowGoldenTips] = useState(false);
    const [goldenTips, setGoldenTips] = useState<GoldenTip[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleShowTips = () => {
        if (trips && vehicles && shippers) {
            const generatedTips = generateGoldenTips(trips, vehicles, shippers);
            setGoldenTips(generatedTips);
            setShowGoldenTips(true);
        }
    };

    if (insights.length === 0) return null;

    // Filter only high impact or vital insights for the compact view
    const vitalInsights = insights.filter(i => i.impactScore > 75).slice(0, 3);
    const displayInsights = isExpanded ? insights : vitalInsights;

    return (
        <>
            <div className="w-full bg-slate-900 border-y border-slate-800 backdrop-blur-md mb-6 transition-all">
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-3 gap-4">

                    {/* Header Compacto */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <BrainCircuit className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                Ribeirx AI
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </h3>
                        </div>
                    </div>

                    {/* Compact Ticker / Grid */}
                    <div className="flex-1 w-full md:w-auto">
                        <div className="flex flex-col md:flex-row gap-3 overflow-x-auto md:overflow-visible">
                            {displayInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs whitespace-nowrap md:whitespace-normal transition-all ${insight.type === 'negative' ? 'bg-rose-500/5 border-rose-500/10 text-rose-200' :
                                        insight.type === 'positive' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-200' :
                                            'bg-sky-500/5 border-sky-500/10 text-sky-200'
                                        }`}
                                >
                                    {insight.type === 'negative' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> :
                                        insight.type === 'positive' ? <UserCheck className="w-3.5 h-3.5 shrink-0" /> :
                                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />}

                                    <div className="flex flex-col">
                                        <span className="font-bold">{insight.title}</span>
                                        <span className="opacity-70 text-[10px] hidden lg:block">{insight.description}</span>
                                    </div>
                                </div>
                            ))}
                            {displayInsights.length === 0 && (
                                <span className="text-xs text-slate-500 italic px-2">Nenhuma anomalia detectada. Sistema operando normalmente.</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleShowTips}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Dicas de Ouro</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Golden Tips Modal (Unchanged logic, same UI) */}
            {showGoldenTips && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowGoldenTips(false)} />
                    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600" />
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                        <Lightbulb className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">3 Dicas de Ouro</h2>
                                        <p className="text-sm text-amber-400/80 font-medium">Insights exclusivos baseados nos seus dados</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowGoldenTips(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {goldenTips.map((tip, index) => (
                                    <div key={index} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl flex gap-4 group hover:border-amber-500/30 transition-colors">
                                        <div className="text-4xl font-black text-slate-800 group-hover:text-amber-500/20 transition-colors select-none">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-2">
                                                {tip.title}
                                                {index === 0 && <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 rounded uppercase">Top</span>}
                                            </h4>
                                            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{tip.description}</p>
                                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                                                <p className="text-xs text-amber-300 font-medium flex items-start gap-2">
                                                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                                                    {tip.impact}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
