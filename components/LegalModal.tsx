import React from 'react';
import { X, Shield, Scale, FileText } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const content = {
        terms: {
            title: 'Termos de Uso',
            icon: <Scale className="w-6 h-6 text-emerald-500" />,
            text: `
                1. Aceitação dos Termos: Ao utilizar o Ribeirx Log, você concorda com estes termos.
                2. Uso do Serviço: O sistema é destinado à gestão logística e financeira de transportes.
                3. Responsabilidade: O usuário é responsável pela veracidade dos dados inseridos.
                4. Assinaturas: Os planos são cobrados conforme descrito na página de preços.
                5. Cancelamento: O usuário pode solicitar o cancelamento a qualquer momento via suporte.
            `
        },
        privacy: {
            title: 'Política de Privacidade',
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            text: `
                1. Coleta de Dados: Coletamos dados necessários para a operação logística (CNPJ, Placas, Dados de Viagem).
                2. Segurança: Utilizamos criptografia e padrões de mercado para proteger suas informações.
                3. Compartilhamento: Não vendemos seus dados para terceiros.
                4. Armazenamento: Seus dados ficam armazenados de forma segura em servidores Supabase.
                5. Seus Direitos: Você pode solicitar a exclusão de sua conta e dados a qualquer momento.
            `
        }
    };

    const current = content[type];

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[600] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            {current.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">{current.title}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ribeirx Log Legal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-invert max-w-none text-slate-400 text-sm leading-relaxed space-y-4">
                        {current.text.split('\n').map((line, i) => (
                            line.trim() && <p key={i}>{line.trim()}</p>
                        ))}
                    </div>
                </div>
                <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-emerald-500 text-emerald-950 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
