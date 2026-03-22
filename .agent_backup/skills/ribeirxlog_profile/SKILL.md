---
name: ribeirxlog_profile
description: |
  Perfil completo do Arthur (fundador do RibeirxLog), preferências de trabalho,
  stack técnica, arquitetura do projeto e regras de desenvolvimento.
  LEIA ESTE ARQUIVO ANTES DE QUALQUER INTERAÇÃO COM O PROJETO.
---

# 👤 Quem é o Arthur

- **Nome:** Arthur Ribeiro (ribeirx-arthur)
- **Cargo:** Fundador solo / Full-Stack Developer do **RibeirxLog**
- **Localização:** Brasil
- **GitHub:** [ribeirx-arthur/ribeirxlog](https://github.com/ribeirx-arthur/ribeirxlog)
- **Domínio:** [ribeirxlog.com.br](https://ribeirxlog.com.br)
- **Idioma principal:** Português brasileiro (todas as mensagens de UI, alertas e erros do app são em **PT-BR**)
- **OS:** Windows (PowerShell) – comandos de terminal devem ser compatíveis com PowerShell (sem `&&`, usar `;` ou comandos separados)

---

# 🚀 O Projeto — RibeirxLog

## Visão Geral
**RibeirxLog** é um SaaS B2B de inteligência logística para **transportadores rodoviários autônomos e pequenas transportadoras brasileiras**. Não é apenas um ERP — é um parceiro estratégico que calcula a rentabilidade real de cada quilômetro rodado.

## Mercado-Alvo
- Caminhoneiros autônomos (Pessoa Física)
- Pequenos frotistas (2-10 caminhões)
- Transportadoras em crescimento

## Diferenciais
1. **Calculadora de Frete com IA** (RBS Engine) – calcula custos "invisíveis" (pneus, depreciação, manutenção)
2. **App do Motorista** – GPS, comprovantes, checklist de segurança
3. **ERP All-in-One** – Dashboard financeiro, gestão de frota, BI estratégico, pneus, manutenção

## Modelo de Monetização
- Planos: Piloto, Gestor Pro, Frota Elite
- Frequências: Mensal, Anual, Lifetime
- Paywall que bloqueia funções avançadas para usuários gratuitos

---

# 🛠️ Stack Técnica

| Camada | Tecnologia | Versão / Observações |
|--------|-----------|---------------------|
| **Framework** | Next.js (App Router) | `latest` (v14+) |
| **Linguagem** | TypeScript | `~5.8.2` |
| **UI/Styling** | Tailwind CSS | `v3.3.0` — **NÃO usar v4** |
| **Autenticação** | Clerk (`@clerk/nextjs`) | `^6.37.1` — template Supabase: `'supabase'` |
| **Banco de Dados** | Supabase | `^2.93.2` — RLS habilitado |
| **Charts** | Recharts | `2.12.7` |
| **PDF** | jsPDF + jspdf-autotable | Geração de recibos e relatórios |
| **Ícones** | Lucide React | `0.460.0` |
| **PWA** | `@ducanh2912/next-pwa` | Offline sync + push notifications |
| **Analytics** | Vercel Analytics + Speed Insights | |
| **IA** | `@google/genai` | Análise estratégica / insights |
| **Deploy** | Vercel | Push no `main` → deploy automático |

---

# 📁 Arquitetura do Projeto

```
ribeirxlog app/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Página principal (1283 linhas) — orquestra TUDO
│   ├── driver/             # Rotas do App do Motorista
│   └── api/                # API Routes (checkout, etc.)
├── components/             # 29 componentes TSX
│   ├── Dashboard.tsx       # Visão neural financeira
│   ├── Trips.tsx           # Gestão de viagens + upload de documentos
│   ├── FreightCalculator   # Calculadora de frete com IA
│   ├── DriverApp.tsx       # Interface do motorista
│   ├── LandingPage.tsx     # Landing page de conversão
│   ├── Setup.tsx           # Cadastro de veículos/motoristas/transportadoras
│   ├── Settings.tsx        # Configurações do usuário
│   ├── Performance.tsx     # BI Avançado
│   ├── FleetHealth.tsx     # Saúde da frota
│   ├── TireManagement.tsx  # Gestão de pneus
│   ├── GPSTracking.tsx     # Mapa e rastreamento
│   ├── DriverManagement    # Gestão de motoristas
│   ├── Onboarding.tsx      # Wizard de primeiros passos
│   ├── Paywall.tsx         # Bloqueio de funcionalidades
│   ├── AdminPanel.tsx      # Painel administrativo
│   └── ...
├── services/               # Lógica de negócio
│   ├── supabase.ts         # Cliente Supabase + createClerkSupabaseClient
│   ├── finance.ts          # Motor de cálculo financeiro
│   ├── pdfGenerator.ts     # Geração de PDFs
│   ├── aiAnalysis.ts       # Insights com IA
│   ├── offlineSync.ts      # Sincronização offline (PWA)
│   └── PushManager.ts      # Push notifications
├── contexts/
│   └── AppModeContext.tsx   # Contexto modal (simples/avançado)
├── types.ts                # Todas as interfaces (Vehicle, Trip, Driver, etc.)
├── constants.tsx            # Constantes e defaults
├── pricing.ts              # Planos e preços
└── .agent/
    └── NEXT_SESSION_PROMPT.md  # Roadmap detalhado de tasks pendentes
```

---

# 🎨 Design System & Estética

## Paleta de Cores (Dark Mode obrigatório)
| Token | Valor | Uso |
|-------|-------|-----|
| **Fundo principal** | `slate-950` (`#020617`) | Background do app |
| **Card/Container** | `bg-slate-900 border border-slate-800` | Containers e cards |
| **Primária** | `emerald-500` (`#10b981`) | CTAs, sucesso, destaque |
| **Secundária** | `sky-500` | Informação, links, GPS |
| **Alerta** | `amber-500` | Pendentes, avisos |
| **Perigo** | `rose-500` | Erros, exclusões |
| **Texto** | `white` (título), `slate-400` (subtítulo), `slate-500` (label) | |

## Padrões de Componentes
- **Cards:** `bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8`
- **Headers:** `font-black uppercase tracking-tighter`
- **Labels:** `text-[10px] font-black text-slate-500 uppercase ml-1`
- **Animações de entrada:** `animate-in slide-in-from-bottom-4 duration-500`
- **Botão primário:** `bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20`
- **Botão perigo:** `bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl`

## Regras Visuais Rígidas
1. **NUNCA** usar cores genéricas (plain red, blue, green)
2. **SEMPRE** dark mode — o tema light existe mas dark é o padrão
3. **Cards arredondados** com `rounded-[2.5rem]` ou `rounded-3xl`
4. **Glassmorphism** em headers/overlays quando apropriado
5. **Micro-animações** em hover e transições
6. **Ícones Lucide** — nunca SVGs customizados

---

# 🔧 Padrões de Código

## Supabase Client
```typescript
// SEMPRE buscar token autenticado do Clerk antes de operações protegidas
const token = await getToken({ template: 'supabase' });
const client = token ? createClerkSupabaseClient(token) : supabase;
```

## Nomenclatura de Colunas (camelCase → snake_case)
O TypeScript usa **camelCase** mas o Supabase usa **snake_case**. Sempre mapear:
- `vehicleId` → `vehicle_id`
- `departureDate` → `departure_date`
- `freteSeco` → `frete_seco`
- `totalKm` → `total_km`
- etc.

## Tratamento de Erros
- **Console:** `console.error('DEBUG - [Contexto]:', error);`
- **Alertas ao usuário:** Em PT-BR, com detalhes técnicos e sugestões claras
- **Formato de alert de erro:**
```
[ERRO DE {AÇÃO}]

Mensagem: {error.message}
Código: {error.code}

Verifique se:
1. {checklist item 1}
2. {checklist item 2}
```

## Upload de Arquivos (Supabase Storage)
- **Bucket:** `trip-proofs`
- **SEMPRE sanitizar** nomes de arquivo (remover acentos, espaços → underscores)
- Usar `upsert: true` e `cacheControl: '3600'`
- Limpar o input file após upload (`e.target.value = ''`)

## Perfil/Config
- O `profile` é passado como **prop** por todos os componentes
- Use `handleConfigChange` para salvar config
- O `UserProfile.config` contém todas as flags de features

## Notificações
- Array `notifications` gerenciado em `app/page.tsx`
- Novas notificações devem ser adicionadas ao array existente
- Usar `showToast()` para feedback rápido

---

# 💼 Modo de Trabalho do Arthur

## Comunicação
1. **Idioma:** Sempre responder em **Português Brasileiro**
2. **Tom:** Direto, prático, sem enrolação — ele é desenvolvedor e entende código
3. **Quando em dúvida:** Pergunte antes de implementar — não assuma
4. **Feedback:** Sempre explique O QUE mudou e POR QUÊ

## Fluxo de Trabalho Típico
1. Arthur descreve o problema ou feature desejada (geralmente em PT-BR, de forma curta)
2. Implementar a solução diretamente nos arquivos corretos
3. Mostrar o que foi alterado (diff)
4. **Commitar e Push automático** quando Arthur pede "push ao github"
   - Formato de commit: `fix(escopo): descrição curta` ou `feat(escopo): descrição curta`
   - Usar comandos separados no PowerShell (não `&&`)

## Prioridades do Arthur
1. **Velocidade de entrega** — prefere soluções rápidas e funcionais
2. **Visual premium** — o app deve impressionar visualmente
3. **Estabilidade** — bugs em produção são inaceitáveis (deploy automático no Vercel)
4. **Marketing/Vendas** — se preocupa com conversão e engajamento
5. **Segurança** — RLS e auth são prioridades (já teve auditoria de segurança)

## O que Arthur NÃO gosta
- Respostas longas demais sem ação prática
- Placeholders ou dados fake quando dá pra usar dados reais
- Ignorar erros silenciosamente (sempre exibir erro detalhado pro usuário)
- Mudanças que quebram o build (sempre verificar antes de commitar)

---

# 🗂️ Tabelas Supabase Conhecidas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (config, plano, empresa) |
| `vehicles` | Veículos da frota |
| `drivers` | Motoristas |
| `shippers` | Transportadoras/Embarcadores |
| `trips` | Viagens (frete, despesas, status) |
| `trip_proofs` | Comprovantes/documentos anexados a viagens |
| `buggies` | Implementos rodoviários |
| `tires` | Pneus individuais |
| `maintenance_records` | Registros de manutenção |
| `vehicle_locations` | Posições GPS em tempo real |
| `gps_alerts` | Alertas de GPS (velocidade, geofence) |

> **RLS está habilitado** em todas as tabelas. Usar o client autenticado do Clerk sempre.

---

# ⚠️ Gotchas & Problemas Conhecidos

1. **PowerShell não suporta `&&`** — usar `;` ou comandos separados
2. **Template Clerk deve ser `'supabase'`** — se falhar, o fallback é o anon client
3. **Nomes de arquivo com acentos** no upload → **sanitizar sempre**
4. **Coluna `observations` em `trip_proofs`** pode não existir no banco — usar fallback
5. **O `app/page.tsx` tem 1283 linhas** — é o orquestrador central, cuidado ao editar
6. **Tailwind v3** não v4 — não usar sintaxe de v4
7. **Deploy automático** via Vercel — qualquer push no `main` vai pra produção imediatamente

---

# 📋 Roadmap Pendente

Consultar `.agent/NEXT_SESSION_PROMPT.md` para a lista completa de tasks pendentes com prioridades.

**Resumo das áreas prioritárias:**
1. Onboarding de novos usuários ✅ (implementado)
2. Prova social na Landing Page
3. Destaque da Calculadora de Frete na Landing
4. Alertas de CNH ✅ (implementado)
5. Status de viagem em tempo real (melhorias)
6. Resumo mensal via WhatsApp
7. Multi-usuário (colaboradores)

---

# 🔄 Workflows Comuns

## Push para GitHub
```
git add .
git commit -m "fix(escopo): descrição"
git push
```
> Sempre em comandos separados (PowerShell)

## Build Local
```
npm run build
```

## Dev Server
```
npm run dev
```

## Verificar Segurança Supabase
Usar o MCP tool `get_advisors` com type `security` para verificar RLS e vulnerabilidades.
