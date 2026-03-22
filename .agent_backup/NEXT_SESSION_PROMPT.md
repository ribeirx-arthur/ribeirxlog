# 🚀 RIBEIRX LOG — PROMPT MASTER: PRÓXIMA SESSÃO

> **Objetivo:** Implementar todas as melhorias para tornar o SaaS pronto para venda no mercado de gestão de transportadores rodoviários brasileiros.
> **Prioridade:** Máxima — estas são as features que faltam para converter os primeiros clientes pagantes.

---

## CONTEXTO DO PROJETO

**Stack:** Next.js 14 (App Router) + TypeScript + Supabase + Clerk Auth + Tailwind/CSS customizado
**Repositório:** https://github.com/ribeirx-arthur/ribeirxlog
**Mercado-alvo:** Transportadores rodoviários autônomos e pequenas transportadoras brasileiras
**Diferencial:** Calculadora de Frete com IA + App do Motorista + ERP all-in-one

O app já tem: Dashboard financeiro, registro de viagens, calculadora de frete com IA, app do motorista, GPS tracking, gestão de frota, saúde do veículo, controle de pneus, manutenção, BI estratégico, planos de assinatura.

---

## TAREFA 1 — ONBOARDING (PRIORIDADE MÁXIMA 🔴)

### Objetivo
Criar uma tela de "Primeiros Passos" que aparece para novos usuários logo após o cadastro, guiando-os a configurar o sistema antes de usar.

### O que implementar

**Arquivo a criar:** `components/Onboarding.tsx`

**Lógica de exibição:** Em `app/page.tsx`, verificar se `profile.config.onboardingCompleted !== true`. Se sim, mostrar o Onboarding antes do Dashboard.

**Adicionar ao tipo `UserProfile.config` em `types.ts`:**
```ts
onboardingCompleted?: boolean;
```

**Design do Onboarding:**
- Fundo dark com gradiente emerald (igual ao restante do app)
- Logo RIBEIRXLOG + RIBEIRXLOG em destaque no topo
- Título: "Vamos configurar sua empresa em 3 passos"
- Subtítulo: "Leva menos de 2 minutos. Sem burocracia."

**Passo 1 — Empresa:**
- Campo: Nome da empresa (ex: "Transportadora São Paulo")
- Campo: Cidade base de operação
- Botão: "Próximo →"

**Passo 2 — Seu primeiro Veículo:**
- Campo: Placa (ex: ABC-1234)
- Dropdown: Tipo de caminhão (2/3/4/6/9 eixos)
- Campo: Apelido do caminhão (ex: "Scania Azul")
- Botão: "Próximo →"

**Passo 3 — Seu primeiro Motorista:**
- Campo: Nome completo do motorista
- Campo: CPF
- Campo: Telefone celular
- Botão: "Finalizar Setup →"

**Ao finalizar:**
1. Salvar `companyName` no perfil via Supabase
2. Criar o veículo via a função `onAddVehicle` existente
3. Criar o motorista via a função `onAddDriver` existente
4. Marcar `profile.config.onboardingCompleted = true` e salvar
5. Redirecionar para o Dashboard com uma notificação toast: "🎉 Tudo pronto! Bem-vindo ao Ribeirx Log."

**Indicador de progresso:** Barra de progresso animada no topo (33% → 66% → 100%)

**Importante:** O botão "Pular por agora" deve estar disponível mas em texto pequeno e cinza, nunca em destaque. Se pulado, marcar como concluído também.

---

## TAREFA 2 — PROVA SOCIAL NA LANDING PAGE (PRIORIDADE ALTA 🟠)

### Objetivo
Adicionar seção de depoimentos reais na `LandingPage.tsx` para aumentar conversão.

### O que implementar

Adicionar uma nova seção **entre a seção de features e a seção de planos** na `LandingPage.tsx`.

**Título da seção:** `"O que dizem os transportadores que já usam"`

**Layout:** Grid de 3 cards responsivo (1 coluna mobile, 3 desktop)

**3 Depoimentos para usar (formato final, não placeholder):**

```
Depoimento 1:
  Nome: "João Carlos Ferreira"
  Cidade: "São Paulo, SP"
  Cargo: "Motorista Autônomo — 6 eixos"
  Texto: "Antes eu anotava tudo no papel e sempre esquecia de cobrar pedágio e diária. Agora lanço a viagem no app e já aparece o valor certo. Economizei R$ 800 no primeiro mês só de erro de cálculo."
  Estrelas: 5

Depoimento 2:
  Nome: "Maria Aparecida Santos"
  Cidade: "Uberlândia, MG"
  Cargo: "Proprietária — Frota com 3 caminhões"
  Texto: "Finalmente consigo ver qual caminhão dá lucro e qual tá me dando prejuízo. O dashboard financeiro é simples e funciona. Não precisa de contador pra entender."
  Estrelas: 5

Depoimento 3:
  Nome: "Rodrigo Mendes"
  Cidade: "Curitiba, PR"
  Cargo: "Transportador Autônomo — 9 eixos"
  Texto: "A calculadora de frete salvou minha vida. Eu aceitava frete ruim sem saber. Agora antes de fechar qualquer valor eu calculo no app. Já recusei 3 fretes podres esse mês."
  Estrelas: 5
```

**Design dos cards:**
- Background: `bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8`
- Estrelas em amarelo/âmbar no topo do card
- Aspas grandes decorativas em emerald (opacidade 10%)
- Nome em branco bold, cargo em slate-400 text-xs uppercase
- Badge de cidade pequeno no rodapé

---

## TAREFA 3 — ALERTA DE VENCIMENTO DE CNH E DOCUMENTOS (PRIORIDADE ALTA 🟠)

### Objetivo
Criar um sistema de alertas automáticos para CNH e documentos dos motoristas.

### O que implementar

**Em `types.ts` — Adicionar ao interface `Driver`:**
```ts
cnhValidity: string;       // já existe — confirmar que está salvo no Supabase
licenseRenewalReminder?: boolean; // usuário pode desativar
```

**Em `app/page.tsx` — Lógica de notificações (`generateNotifications` ou equivalente):**

Ao carregar o app, verificar todos os motoristas. Para cada um com `cnhValidity` definido:
- Se vence em ≤ 60 dias → criar notificação `type: 'system'` com título: `"⚠️ CNH de [Nome] vence em [X] dias"`
- Se vence em ≤ 30 dias → notificação urgente com título: `"🚨 ALERTA: CNH de [Nome] vence em [X] dias — Renove agora!"`
- Se já venceu → notificação crítica: `"❌ CNH de [Nome] VENCIDA. Veículo não pode circular!"`

**No Header/Notificações:**
- Badge de contagem vermelha já existe — apenas garantir que essas notificações de CNH aparecem nele
- As notificações devem ter um link/ação que direciona para a aba de Motoristas (Setup)

**No `DriverManagement.tsx`:**
- Adicionar badge visual na linha do motorista com CNH próxima do vencimento:
  - Verde: > 60 dias
  - Âmbar: 30-60 dias  
  - Vermelho pulsante: < 30 dias ou vencida

---

## TAREFA 4 — RELATÓRIO MENSAL AUTOMÁTICO VIA WHATSAPP (PRIORIDADE MÉDIA 🟡)

### Objetivo
Permitir que o gestor gere e envie um PDF de resumo mensal direto pelo WhatsApp com 1 clique.

### O que implementar

**Em `services/pdfGenerator.ts` — Adicionar nova função:**
```ts
export const generateMonthlyWhatsAppSummary = (
  trips: Trip[],
  vehicles: Vehicle[],
  drivers: Driver[],
  profile: UserProfile,
  month: Date
): string
```
Esta função retorna uma **mensagem de texto formatada** (não PDF) com os dados do mês:
- Total de viagens realizadas
- Faturamento bruto total
- Lucro líquido total
- Motorista mais produtivo
- Veículo mais lucrativo
- Comparação com mês anterior (% de crescimento)

**Em `Dashboard.tsx` — Adicionar botão:**
- Botão "📲 Enviar Resumo do Mês" no header do Dashboard
- Ao clicar: gerar a mensagem e abrir `https://wa.me/[numero_whatsapp_do_gestor]?text=[mensagem_codificada]`
- Se não tiver número cadastrado, abrir modal para inserir o número

**Em `Settings.tsx` — Campo adicional:**
- Em Perfil → adicionar campo "Número WhatsApp (para relatórios)" tipo telefone
- Salvar em `profile.whatsapp` no Supabase

**Em `types.ts` — Adicionar ao `UserProfile`:**
```ts
whatsapp?: string;
```

---

## TAREFA 5 — MULTI-USUÁRIO: CONVIDAR COLABORADOR (PRIORIDADE MÉDIA 🟡)

### Objetivo
Permitir que um dono de conta convide um contador ou sócio para visualizar os dados com acesso limitado.

### O que implementar

**Criar tabela no Supabase (migration):**
```sql
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- 'viewer' | 'editor'
  status TEXT DEFAULT 'pending', -- 'pending' | 'active'
  invited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, email)
);
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner controls collaborators" ON collaborators
  USING (auth.uid() = owner_id);
```

**Em `Settings.tsx` — Nova aba "Equipe":**
- Lista de colaboradores atuais com status (pendente/ativo)
- Campo de email para convidar novo colaborador
- Selector de permissão: "Apenas visualizar" | "Pode editar"
- Botão "Enviar Convite" → envia email via Supabase Auth `inviteUserByEmail` ou abre WhatsApp com link de convite

**Em `app/page.tsx`:**
- Ao carregar, verificar se o usuário atual é colaborador de outra conta
- Se sim, carregar os dados do dono (owner) em modo readonly se role === 'viewer'

---

## TAREFA 6 — MELHORAR STATUS DE VIAGEM EM TEMPO REAL (PRIORIDADE MÉDIA 🟡)

### Objetivo
Tornar o fluxo de status da viagem mais fluido com feedback visual ao gestor quando o motorista atualiza.

### O que implementar

**Em `types.ts` — Transit status já existe, garantir que é:**
```ts
transitStatus?: 'Agendado' | 'Em Carga' | 'Em Trânsito' | 'Finalizado' | 'Problema'
```
Adicionar: `'Em Carga'` e `'Problema'` se ainda não existirem.

**Em `DriverApp.tsx`:**
- Botão de status mais visível com ícones grandes e cores fortes
- At status "Problema" → Modal para o motorista descrever o problema (ex: "Pneu furado", "Acidente")
- Isso gera uma notificação automática para o gestor

**Em `Dashboard.tsx`:**
- Card "Viagens em Andamento" mostrando status atual com barra de progresso visual (Agendado → Em Carga → Em Trânsito → Finalizado)
- Atualização em tempo real usando Supabase Realtime (`supabase.from('trips').on('UPDATE', ...)`)

**Em `Trips.tsx`:**
- Badge de status colorido e animado na lista de viagens:
  - Cinza: Agendado
  - Azul pulsante: Em Carga
  - Âmbar pulsante: Em Trânsito
  - Vermelho pulsante: Problema
  - Verde: Finalizado

---

## TAREFA 7 — MELHORAR A LANDING PAGE (DESTAQUE DA CALCULADORA) (PRIORIDADE ALTA 🟠)

### Objetivo
A Calculadora de Frete com IA é o maior diferencial do produto e está mal comunicada na landing. Ela precisa de uma seção hero própria.

### O que implementar em `LandingPage.tsx`

**Nova seção dedicada à Calculadora** (adicionar após a seção de features existente, antes dos depoimentos):

**Título:** `"Nunca mais aceite um frete ruim"`
**Subtítulo:** `"Nossa calculadora com IA analisa combustível, pneus, mecânica, comissão do motorista e pedágios — e te diz se o frete vale a pena em segundos."`

**Layout:** Split screen (texto esquerda, simulação interativa direita)

**Simulador fake (lado direito) — apenas visual, não precisa calcular:**
- Input: "Distância: 800 km"
- Input: "Frete: R$ 3.200,00"
- Resultado animado aparecendo: 
  - ✅ Lucro Líquido: **R$ 1.847,00**
  - ⛽ Combustível: R$ 720,00
  - 🛞 Pneus/Manut.: R$ 340,00
  - 👤 Comissão Motorista: R$ 293,00
  - Badge verde: "FRETE VIÁVEL"

**Efeito:** Os números devem "contar" de 0 até o valor final quando a seção entra na viewport (Intersection Observer).

---

## ORDEM DE EXECUÇÃO SUGERIDA

```
1. Tarefa 1 (Onboarding)           — Impacto imediato na ativação
2. Tarefa 2 (Prova Social Landing) — Impacto imediato na conversão
3. Tarefa 7 (Landing Calculadora)  — Impacto imediato na atração
4. Tarefa 3 (Alertas CNH)          — Cria retenção/dependência
5. Tarefa 6 (Status Viagem)        — Melhora experiência do motorista
6. Tarefa 4 (Resumo WhatsApp)      — Feature WOW de retenção
7. Tarefa 5 (Multi-usuário)        — Expande ticket médio
```

---

## NOTAS TÉCNICAS IMPORTANTES

- **Não usar Tailwind v4** — o projeto usa CSS customizado com classes do Tailwind v3
- **Padrão de cards:** `bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8`
- **Cor primária:** emerald-500 (`#10b981`)
- **Fundo:** slate-950 (`#020617`)
- **Fonte código:** `font-black uppercase tracking-tighter` para headers
- **Animações:** usar `animate-in slide-in-from-bottom-4 duration-500` para entradas
- **Supabase client:** importar de `../services/supabase`
- **Perfil global:** passado como prop em todos os componentes
- **handleConfigChange:** já existe no `Settings.tsx` e no `app/page.tsx` — usar para salvar config
- **Notificações:** o sistema de notificações já existe em `app/page.tsx` — adicionar ao array existente

---

*Gerado em: 20/02/2026 | Versão do app na geração: commit pré-features de venda*
