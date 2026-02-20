
import React, { useState, useMemo } from 'react';
import {
    HelpCircle,
    Search,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    Truck,
    TrendingUp,
    ShieldAlert,
    Disc,
    Brain,
    Calculator,
    Database,
    MapPin,
    FolderOpen,
    Users,
    CreditCard,
    PlusCircle,
    Play,
    CheckCircle2,
    Lightbulb,
    AlertTriangle,
    BookOpen,
    Star,
    Zap,
    DollarSign,
    Settings,
    MessageCircle
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../pricing';

const HelpCenter: React.FC = () => {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState<string | null>('inicio-rapido');
    const [openFaqs, setOpenFaqs] = useState<string[]>([]);

    const toggleFaq = (id: string) => {
        setOpenFaqs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const sections = [
        {
            id: 'inicio-rapido',
            label: 'Início Rápido',
            icon: Zap,
            color: 'emerald',
            badge: 'Comece aqui'
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            color: 'sky',
        },
        {
            id: 'nova-viagem',
            label: 'Lançar Viagem',
            icon: PlusCircle,
            color: 'emerald',
        },
        {
            id: 'viagens',
            label: 'Histórico de Viagens',
            icon: Truck,
            color: 'indigo',
        },
        {
            id: 'motoristas',
            label: 'Motoristas',
            icon: Users,
            color: 'violet',
        },
        {
            id: 'calculadora',
            label: 'Calculadora de Frete',
            icon: Calculator,
            color: 'amber',
        },
        {
            id: 'bi-performance',
            label: 'BI & Performance',
            icon: TrendingUp,
            color: 'rose',
        },
        {
            id: 'frota',
            label: 'Saúde da Frota',
            icon: ShieldAlert,
            color: 'orange',
        },
        {
            id: 'pneus',
            label: 'Gestão de Pneus',
            icon: Disc,
            color: 'slate',
        },
        {
            id: 'inteligencia',
            label: 'Inteligência IA',
            icon: Brain,
            color: 'purple',
        },
        {
            id: 'mapa',
            label: 'Mapa & GPS',
            icon: MapPin,
            color: 'teal',
        },
        {
            id: 'documentos',
            label: 'Documentos',
            icon: FolderOpen,
            color: 'sky',
        },
        {
            id: 'cadastros',
            label: 'Cadastros',
            icon: Database,
            color: 'cyan',
        },
        {
            id: 'faq',
            label: 'Dúvidas Frequentes',
            icon: HelpCircle,
            color: 'slate',
        },
    ];

    const content: Record<string, { title: string; subtitle: string; steps?: { icon: any; title: string; desc: string; tip?: string }[]; tips?: string[]; faqs?: { q: string; a: string }[] }> = {
        'inicio-rapido': {
            title: '🚀 Configure o Ribeirx Log em 5 minutos',
            subtitle: 'Siga esses passos na ordem certa para começar a usar com seus dados reais.',
            steps: [
                {
                    icon: Database,
                    title: 'Passo 1 — Cadastre seu Caminhão',
                    desc: 'Vá em "Cadastros" > Veículo > clique em "+ Novo". Informe a placa, apelido, e a quantidade de eixos. Isso é essencial para os cálculos automáticos de desgaste.',
                    tip: 'A quantidade de eixos determina o custo estimado de pneu e manutenção por KM. Escolha corretamente.'
                },
                {
                    icon: Users,
                    title: 'Passo 2 — Cadastre seu Motorista',
                    desc: 'Ainda em "Cadastros" > Motoristas > "+ Novo". Informe o nome, CPF e a data de vencimento da CNH. O sistema vai te alertar quando estiver perto do vencimento.',
                    tip: 'Se você mesmo é o motorista, cadastre seus dados também. O sistema precisa de um motorista para cada viagem.'
                },
                {
                    icon: PlusCircle,
                    title: 'Passo 3 — Lance sua primeira Viagem',
                    desc: 'Clique no botão verde "Novo Lançamento" no menu lateral. Preencha a origem, destino, valor do frete seco, diárias, combustível e adiantamento. O lucro líquido é calculado automaticamente.',
                },
                {
                    icon: LayoutDashboard,
                    title: 'Passo 4 — Veja seu Dashboard',
                    desc: 'Após lançar a viagem, acesse o Dashboard para ver seu faturamento, lucro líquido, comissão do motorista e muito mais. Os gráficos atualizam em tempo real.',
                    tip: 'O Dashboard considera todas as viagens do mês atual por padrão. Use os filtros para ver outros períodos.'
                },
                {
                    icon: Settings,
                    title: 'Passo 5 — Configure suas taxas',
                    desc: 'Em "Configurações" defina a comissão padrão dos motoristas, ative a depreciação global de pneus/mecânica e personalize o app para sua operação.',
                },
            ],
        },

        'dashboard': {
            title: '📊 Dashboard — Seu painel financeiro em tempo real',
            subtitle: 'Tudo o que você precisa saber sobre a saúde financeira da sua operação, num só lugar.',
            steps: [
                { icon: DollarSign, title: 'Faturamento Bruto', desc: 'Soma de todos os fretes secos + diárias do período selecionado. Não desconta nada ainda.' },
                { icon: DollarSign, title: 'Lucro Líquido Real', desc: 'Faturamento Bruto menos: comissão dos motoristas, combustível, outras despesas. Se a Depreciação Global estiver ativa nas Configurações, também desconta pneu e mecânica.' },
                { icon: Truck, title: 'Viagens em Andamento', desc: 'Viagens com status "Em Trânsito" aparecem aqui com o motorista e veículo em operação.' },
                { icon: AlertTriangle, title: 'Alertas de Cobrança', desc: 'Viagens com pagamento atrasado (baseado nos dias médios do embarcador) aparecem em destaque. Configure os dias no cadastro do embarcador.' },
            ],
            tips: [
                'Use o filtro de período (canto superior) para comparar meses diferentes.',
                'O card "Melhor Motorista" mostra quem gerou mais lucro — ótimo para bonificações.',
                'Se o lucro líquido aparecer negativo, revise os custos lançados nas viagens.',
            ]
        },

        'nova-viagem': {
            title: '✈️ Lançar Viagem — Como registrar corretamente',
            subtitle: 'O correto preenchimento da viagem garante que todos os relatórios sejam precisos.',
            steps: [
                { icon: MapPin, title: 'Origem e Destino', desc: 'Digite a cidade de origem e destino. O sistema usa isso para análises de rotas mais lucrativas no módulo de Inteligência.' },
                { icon: DollarSign, title: 'Frete Seco vs Diárias', desc: 'Frete Seco é o valor fixo pelo transporte. Diárias são pagas quando o motorista fica além do prazo (ex: R$100/dia). Separe os valores para a comissão ser calculada corretamente — cada um tem uma taxa diferente.' },
                { icon: DollarSign, title: 'Adiantamento', desc: 'Valor que o embarcador já pagou antes da entrega. O sistema desconta do saldo a receber automaticamente.' },
                { icon: Truck, title: 'KM Rodados', desc: 'Informe os quilômetros totais da viagem. Isso alimenta o odômetro do veículo e os cálculos de desgaste de pneu e manutenção.' },
                { icon: CheckCircle2, title: 'Status de Pagamento', desc: 'Marque "Pendente", "Parcial" ou "Pago" conforme você receber. O Dashboard mostra os valores a receber baseado nesse status.' },
            ],
            tips: [
                'Sempre informe os KMs — sem isso, o sistema não consegue calcular o desgaste do veículo.',
                'Se houver pedágio, some-o em "Outras Despesas".',
                'A data de retorno deve ser a data real de chegada para os alertas de atraso funcionarem.',
            ]
        },

        'viagens': {
            title: '📋 Histórico de Viagens — Controle total da sua operação',
            subtitle: 'Veja, edite, filtre e exporte todas as viagens já registradas.',
            steps: [
                { icon: Search, title: 'Busca e Filtros', desc: 'Use a barra de busca para encontrar por placa, destino ou embarcador. Os filtros permitem ver apenas viagens pendentes, pagas ou de um período específico.' },
                { icon: FolderOpen, title: 'Comprovantes', desc: 'Cada viagem pode ter documentos anexados (CT-e, NF-e, comprovantes de entrega). Clique no ícone de pasta na viagem para gerenciar.' },
                { icon: DollarSign, title: 'Detalhes Financeiros', desc: 'Clique em qualquer viagem para expandir e ver o detalhamento completo: bruto, comissão, saldo a receber e lucro líquido.' },
            ],
            tips: [
                'Ordene por "Maior Lucro" para identificar suas melhores rotas.',
                'Você pode gerar um PDF de recibo de qualquer viagem clicando no menu "⋮".',
                'Viagens em vermelho têm pagamento atrasado — priorize cobrar elas.',
            ]
        },

        'motoristas': {
            title: '👤 Motoristas — Gestão completa do seu time',
            subtitle: 'Controle de comissões, documentação e histórico de cada motorista.',
            steps: [
                { icon: Users, title: 'Cadastro Completo', desc: 'Registre nome, CPF, telefone, categoria da CNH e data de vencimento. O sistema alerta automaticamente quando a CNH estiver próxima do vencimento.' },
                { icon: DollarSign, title: 'Comissão Customizada', desc: 'Cada motorista pode ter uma comissão diferente da comissão padrão definida nas Configurações. Edite o motorista e ative "Comissão Personalizada".' },
                { icon: Star, title: 'App do Motorista', desc: 'Cada motorista tem acesso a um painel próprio pelo link /motoristas/[cpf]. Lá ele vê suas viagens, saldo a receber e pode atualizar o status da entrega.' },
            ],
            tips: [
                'Mantenha o telefone do motorista atualizado — será usado para contato rápido.',
                'Motoristas "Inativos" não aparecem na seleção de novas viagens, mas ficam no histórico.',
                'A comissão de frete seco e de diária são separadas — configure cada uma.',
            ]
        },

        'calculadora': {
            title: '🧮 Calculadora de Frete — Nunca aceite frete ruim',
            subtitle: 'Analise a viabilidade de um frete antes de fechar o valor com o embarcador.',
            steps: [
                { icon: MapPin, title: 'Informe a Rota', desc: 'Digite a distância total (ida e volta se for bate e volta) e o valor do frete proposto pelo embarcador.' },
                { icon: Truck, title: 'Configure o Caminhão', desc: 'Selecione o veículo e informe o consumo médio (km/litro) e o preço do diesel. O sistema calcula o custo de combustível automaticamente.' },
                { icon: DollarSign, title: 'Resultado Instantâneo', desc: 'A calculadora mostra: custo total da viagem, lucro líquido estimado, custo por km, e se o frete é VIÁVEL ou ABAIXO DO CUSTO.' },
                { icon: Brain, title: 'IA Ribeirx', desc: 'O módulo de IA analisa o frete e dá uma dica personalizada — se está em linha com o mercado, se há margem para negociar, ou se deve recusar.' },
            ],
            tips: [
                'Sempre inclua os pedágios estimados em "Despesas Extras".',
                'Use o modo "Bate e Volta" para viagens que retornam no mesmo dia — o custo de diária do motorista muda.',
                'A IA fica mais precisa conforme você lança mais viagens reais no sistema.',
            ]
        },

        'bi-performance': {
            title: '📈 BI & Performance — Inteligência para escalar',
            subtitle: 'Análise профессional da sua operação: quais rotas dão mais lucro, quais motoristas rendem mais, tendências e previsões.',
            steps: [
                { icon: TrendingUp, title: 'Rotas mais Lucrativas', desc: 'O sistema identifica automaticamente quais destinos geram mais lucro por km rodado. Foque nessas rotas para maximizar retorno.' },
                { icon: Users, title: 'Ranking de Motoristas', desc: 'Compare a performance de cada motorista: viagens realizadas, faturamento gerado, e lucro líquido por viagem.' },
                { icon: Truck, title: 'Performance por Veículo', desc: 'Veja qual caminhão é mais lucrativo, qual consome mais, e qual tem mais custo de manutenção. Útil para decidir renovar frota.' },
            ],
            tips: [
                'Filtre por período para comparar trimestres e identificar sazonalidade.',
                'O gráfico de tendência mostra se seu negócio está crescendo ou encolhendo.',
                'Combine os dados de BI com a Calculadora para precificar fretes futuros com mais precisão.',
            ]
        },

        'frota': {
            title: '🔧 Saúde da Frota — Manutenção preventiva que poupa dinheiro',
            subtitle: 'Monitore o estado de cada componente dos seus veículos e evite paradas inesperadas.',
            steps: [
                { icon: ShieldAlert, title: 'Indicador de Saúde', desc: 'Cada veículo tem uma porcentagem de saúde geral (0-100%). É calculada com base nos KMs desde a última manutenção de óleo, pneus, freios e motor.' },
                { icon: PlusCircle, title: 'Lançar Manutenção', desc: 'Registre toda visita à oficina com data, tipo (preventiva/corretiva), descrição e valor. Isso atualiza o histórico e os indicadores automaticamente.' },
                { icon: Settings, title: 'Configurar Intervalos', desc: 'Cada veículo pode ter intervalos diferentes. Clique no ícone de engrenagem no card do veículo para ajustar os KMs de cada troca.' },
            ],
            tips: [
                'Registrar toda manutenção também alimenta os cálculos de custo real por km.',
                'Veículos com saúde abaixo de 20% aparecem em vermelho pulsante — urgente revisar.',
                'O relatório de ativo detalha cada componente individual do veículo.',
            ]
        },

        'pneus': {
            title: '🛞 Gestão de Pneus — Controle do seu maior custo invisível',
            subtitle: 'Pneus são o maior custo por km depois do diesel. Gerencie cada unidade com precisão.',
            steps: [
                { icon: Disc, title: 'Cadastro por Posição', desc: 'Registre cada pneu da frota com marca, medida, e posição no veículo (dianteiro esquerdo, tração dupla etc).' },
                { icon: TrendingUp, title: 'Custo por KM', desc: 'O sistema calcula automaticamente o custo por km de cada pneu baseado no preço de compra e na vida útil esperada.' },
                { icon: AlertTriangle, title: 'Alertas de Troca', desc: 'Quando um pneu atingir 80% da vida útil, um alerta aparece no painel. Configure o limite de km de vida útil por tipo de pneu.' },
            ],
            tips: [
                'Pneus de tração (eixo traseiro carreta) custam mais e desgastam mais rápido.',
                'Rodízio de pneus pode aumentar a vida útil em até 30% — registre os rodízios também.',
                'Use o custo por km do pneu para calibrar o campo "Custo Pneu por KM" nas Configurações.',
            ]
        },

        'inteligencia': {
            title: '🧠 Inteligência IA — Seu assistente estratégico',
            subtitle: 'A IA do Ribeirx Log analisa seus dados e entrega insights que você nunca veria sozinho.',
            steps: [
                { icon: Brain, title: 'Golden Tips', desc: 'Dicas personalizadas baseadas nos seus dados reais. A IA identifica padrões e alerta sobre riscos ou oportunidades na sua operação.' },
                { icon: TrendingUp, title: 'Análise de Tendências', desc: 'Previsão de faturamento baseada no histórico. A IA identifica se seu negócio está em crescimento ou precisa de atenção.' },
                { icon: AlertTriangle, title: 'Alertas Proativos', desc: 'A IA alerta quando um embarcador está atrasando pagamentos repetidamente, quando um motorista está abaixo da média, ou quando uma rota ficou menos lucrativa.' },
            ],
            tips: [
                'Quanto mais viagens você lançar, mais precisa fica a IA.',
                'As dicas aparecem no Dashboard e na aba de Inteligência.',
                'A análise de rotas identifica quais destinos têm melhor custo-benefício para sua frota.',
            ]
        },

        'mapa': {
            title: '🗺️ Mapa & GPS — Rastreamento da sua frota',
            subtitle: 'Visualize onde suas viagens foram realizadas e monitore a operação geograficamente.',
            steps: [
                { icon: MapPin, title: 'Histórico de Rotas', desc: 'O mapa mostra as origens e destinos de todas as viagens registradas. Pontos em verde são origens, pontos em âmbar são destinos.' },
                { icon: Truck, title: 'Status em Tempo Real', desc: 'Viagens marcadas como "Em Trânsito" pelo motorista apareceram destacadas no mapa. O status é atualizado pelo app do motorista.' },
                { icon: AlertTriangle, title: 'Alertas Geográficos', desc: 'O sistema identifica rotas com histórico de problemas e emite alertas preventivos.' },
            ],
            tips: [
                'O mapa usa os dados de origem/destino das viagens registradas, não GPS em tempo real.',
                'Para rastreamento GPS em tempo real, integração futura está planejada.',
                'Clique em qualquer ponto do mapa para ver as viagens daquela rota.',
            ]
        },

        'documentos': {
            title: '📁 Documentos — Galeria de comprovantes',
            subtitle: 'Centralize todos os comprovantes, CT-e, NF-e e fotos de entrega num só lugar.',
            steps: [
                { icon: FolderOpen, title: 'Anexar Documentos', desc: 'Em cada viagem, clique no ícone de pasta para anexar arquivos. Suporta PDF, JPG e PNG. Ideal para CT-e, NF-e, comprovantes de entrega e recibos de pedágio.' },
                { icon: CheckCircle2, title: 'Aprovação', desc: 'O gestor pode marcar um documento como "aprovado". Motoristas podem ver o status pelo app deles.' },
                { icon: Search, title: 'Galeria Central', desc: 'A aba Documentos reúne todos os arquivos de todas as viagens num único painel com busca e filtros por tipo.' },
            ],
            tips: [
                'Mantenha o CT-e de cada viagem anexado — facilita cobranças e auditorias.',
                'Fotos de entrega assinadas são importantes para evitar disputas com embarcadores.',
                'O tamanho máximo por arquivo é 10MB. Para PDFs grandes, comprima antes de enviar.',
            ]
        },

        'cadastros': {
            title: '🗃️ Cadastros — A base de tudo',
            subtitle: 'Gerencie sua frota, motoristas, embarcadores e equipamentos auxiliares.',
            steps: [
                { icon: Truck, title: 'Veículos', desc: 'Cadastre cada caminhão com placa, eixos, marca, modelo e tipo de propriedade. Veículos em Sociedade têm o lucro dividido automaticamente.' },
                { icon: Users, title: 'Motoristas', desc: 'Cadastre cada motorista com CPF, telefone, CNH e comissão personalizada. O CPF é usado para o acesso ao app do motorista.' },
                { icon: Database, title: 'Embarcadores', desc: 'Cadastre clientes/embarcadores com CNPJ e prazo médio de pagamento (em dias). Esse prazo alimenta os alertas de cobrança no Dashboard.' },
            ],
            tips: [
                'Mantenha os cadastros sempre atualizados — eles são a base de todos os relatórios.',
                'Embarcadores com prazo de pagamento 0 não geram alertas de cobrança.',
                'Veículos Próprios e em Sociedade têm tratamentos financeiros diferentes nos relatórios.',
            ]
        },

        'faq': {
            title: '❓ Dúvidas Frequentes',
            subtitle: 'As perguntas mais comuns dos usuários do Ribeirx Log.',
            faqs: [
                {
                    q: 'Como o sistema calcula a comissão do motorista?',
                    a: 'A comissão é calculada separadamente para frete seco e diárias. Ex: comissão frete seco = 10%, comissão diária = 30%. Se o frete seco é R$2.000 e diária R$100, a comissão é (2000 × 10%) + (100 × 30%) = R$230. Configure as taxas padrão em Configurações → Cálculos.'
                },
                {
                    q: 'O que é "Depreciação Global de Pneu/Manut."?',
                    a: 'Quando ativado nas Configurações, o sistema desconta automaticamente um custo estimado de pneu e manutenção baseado nos KMs da viagem. O valor por km é calculado com base nos eixos do caminhão ou você pode definir um valor fixo. Isso torna o lucro líquido mais realista.'
                },
                {
                    q: 'Como o motorista acessa o app dele?',
                    a: 'Acesse o link /motoristas e cada motorista tem um acesso pelo CPF. Ou vá em Motoristas → clique no motorista → "Abrir App do Motorista". De lá, compartilhe o link com ele pelo WhatsApp.'
                },
                {
                    q: 'Posso usar em vários celulares ao mesmo tempo?',
                    a: 'Sim! O app funciona em qualquer navegador. Você acessa pelo celular, o motorista acessa pelo celular dele. Todos os dados ficam sincronizados em tempo real via nuvem.'
                },
                {
                    q: 'Os dados são salvos automaticamente?',
                    a: 'Sim. Tudo é salvo automaticamente na nuvem (Supabase) assim que você confirma um lançamento. Não há risco de perder dados por fechar o app.'
                },
                {
                    q: 'Como gero um PDF de recibo para o cliente?',
                    a: 'No histórico de Viagens, clique no menu "⋮" de qualquer viagem e selecione "Gerar PDF". O recibo profissional é gerado com logo da empresa, dados da viagem e valores.'
                },
                {
                    q: 'Posso ter mais de um caminhão cadastrado?',
                    a: 'Sim! No plano pago você pode cadastrar frota ilimitada. Na versão gratuita há limite de registro. Vá em Assinatura para ver as opções de upgrade.'
                },
                {
                    q: 'O que fazer se um frete foi parcialmente pago?',
                    a: 'Na viagem, marque o status como "Parcial" e registre no campo de observações o valor já recebido. O Dashboard mostrará esse valor em "A Receber".'
                },
                {
                    q: 'Como funciona o APP do motorista?',
                    a: 'O motorista tem acesso a um painel simplificado onde vê: suas viagens, saldo a receber, adiantamentos e pode atualizar o status da viagem (Em Trânsito, Entregue). Ele NÃO vê os dados financeiros globais da empresa.'
                },
            ]
        }
    };

    const currentSection = sections.find(s => s.id === activeSection);
    const currentContent = activeSection ? content[activeSection] : null;

    const filteredSections = useMemo(() => {
        if (!search) return sections;
        return sections.filter(s =>
            s.label.toLowerCase().includes(search.toLowerCase()) ||
            (content[s.id]?.title || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const colorMap: Record<string, string> = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-24">

            {/* ─── Left Sidebar ─── */}
            <aside className="lg:w-72 shrink-0 space-y-4">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/20 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter">Central de Ajuda</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tutoriais & Guias</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar tutorial..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {/* Nav */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 space-y-1">
                    {filteredSections.map(s => {
                        const Icon = s.icon;
                        const isActive = activeSection === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${isActive
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : 'group-hover:text-emerald-500 transition-colors'}`} />
                                <span className="text-xs font-bold flex-1">{s.label}</span>
                                {s.badge && (
                                    <span className="text-[8px] font-black bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full uppercase tracking-wider">{s.badge}</span>
                                )}
                                {isActive && <ChevronRight className="w-3 h-3 text-emerald-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* Support CTA */}
                <button
                    onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Preciso de ajuda com o Ribeirx Log.')}`, '_blank')}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest text-xs"
                >
                    <MessageCircle className="w-5 h-5" />
                    Falar no WhatsApp
                </button>
            </aside>

            {/* ─── Content ─── */}
            <main className="flex-1 min-w-0 space-y-8">
                {currentContent && (
                    <>
                        {/* Title */}
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tighter">{currentContent.title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">{currentContent.subtitle}</p>
                        </div>

                        {/* Steps */}
                        {currentContent.steps && (
                            <div className="space-y-4">
                                {currentContent.steps.map((step, i) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex gap-5 group hover:border-emerald-500/30 transition-all">
                                            <div className="shrink-0 w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-white mb-1">{step.title}</h3>
                                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                                {step.tip && (
                                                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] text-amber-400 font-medium leading-relaxed">{step.tip}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-black">
                                                {i + 1}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tips */}
                        {currentContent.tips && (
                            <div className="bg-slate-900 border border-emerald-500/10 rounded-[2rem] p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Dicas Pro</h3>
                                </div>
                                <div className="space-y-3">
                                    {currentContent.tips.map((tip, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-slate-400 text-sm leading-relaxed">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FAQs */}
                        {currentContent.faqs && (
                            <div className="space-y-3">
                                {currentContent.faqs.map((faq, i) => {
                                    const id = `faq-${i}`;
                                    const isOpen = openFaqs.includes(id);
                                    return (
                                        <div key={id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden transition-all hover:border-slate-700">
                                            <button
                                                onClick={() => toggleFaq(id)}
                                                className="w-full flex items-center justify-between p-6 text-left gap-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                        <HelpCircle className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{faq.q}</span>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-6">
                                                    <div className="pl-12">
                                                        <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Bottom CTA */}
                        <div className="bg-gradient-to-br from-slate-900 to-emerald-900/10 border border-emerald-500/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-white">Não encontrou o que procurava?</p>
                                <p className="text-xs text-slate-500">Mande uma mensagem direta. Respondo rápido.</p>
                            </div>
                            <button
                                onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre o Ribeirx Log: ')}`, '_blank')}
                                className="shrink-0 flex items-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl transition-all uppercase tracking-wider text-xs shadow-xl shadow-emerald-500/20"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Tirar Dúvida no WhatsApp
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HelpCenter;
