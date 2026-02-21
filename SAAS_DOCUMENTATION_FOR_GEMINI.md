# RibeirxLog - SaaS de Inteligência Logística Avançada
**Versão:** 1.7.1
**Objetivo:** Gerenciamento estratégico de frotas e automação de lucros reais para transportadores e motoristas autônomos.

---

## 🚀 Proposta de Valor
A RibeirxLog não é apenas um ERP de logística; ela é um parceiro estratégico que utiliza cálculos precisos da realidade brasileira (Matriz Ribeirx 2024) para identificar a rentabilidade real de cada quilômetro rodado, prevenindo prejuízos "invisíveis" como depreciação de pneus e manutenção.

---

## 🛠️ Arquitetura de Funcionalidades por Aba

### 1. Dashboard (Visão Neural Financeira)
*   **Visão Geral:** Métricas de faturamento bruto, lucro líquido real, saldo a receber e comissões.
*   **Insights IA:** Analisa os dados da frota para sugerir melhorias operacionais.
*   **Desempenho de Câmbio:** Gráficos interativos que mostram a saúde do caixa em tempo real.
*   **Modos de Visualização:** Suporta modo "Simples" para operações rápidas e modo "Neural/Profundo" para análise técnica detalhada.

### 2. Viagens (Gestão de Fretes)
*   **Histórico Dinâmico:** Listagem completa de todos os lançamentos com status de pagamento (Pendente/Pago).
*   **Rastreio & Documentação:** Clique em qualquer viagem para ver a última localização GPS enviada pelo motorista e a galeria de documentos/comprovantes.
*   **Recibo PDF:** Geração instantânea de comprovantes oficiais para envio ao motorista ou cliente.
*   **Rentabilidade Real:** Exibe o lucro seco, lucro sociedade e saldo a receber sem descontar a comissão (conforme prática de mercado).

### 3. Simulador de Frete (RBS Engine)
*   **Cálculo Estratégico:** Vai além do diesel e pedágio. Calcula o frete sugerido com base na margem de lucro desejada.
*   **Detecção de Modelo:** Identifica automaticamente o consumo (km/l) e custos técnicos se o caminhão for Mercedes Actros, Volvo FH, Scania R, etc.
*   **Custos Invisíveis:** Provisão automática para troca de pneus e manutenção preventiva baseada no trecho.
*   **Fatores Adicionais:** Configurações para carga química (+20%) ou Logística Segura/Escolta (+15%).

### 4. Gestão de Motoristas (Driver Pro)
*   **Controle de Equipe:** Gestão de motoristas próprios, terceirizados ou agregados.
*   **Comissões Personalizadas:** Definição de % de frete e % de diárias individualmente.
*   **App do Motorista:** Módulo simplificado para o motorista bater ponto, enviar localização GPS e tirar fotos de comprovantes (Canhotos/Abastecimento).

### 5. Saúde da Frota & Pneus
*   **Manutenção Preventiva:** Alertas baseados em quilometragem e tempo.
*   **Gestão de Pneus (Deep Management):** Rastreio individual de cada pneu por ID, posição no eixo, marca e sulco. Previsão de custo de recapagem vs. novo.
*   **Status de Disponibilidade:** Indica quais veículos estão em trânsito, oficina ou disponíveis.

### 6. Mapa & Rastreamento (GPS Tracking)
*   **Monitoramento Real-Time:** Mapa unificado com a posição de toda a frota através do sinal captado pelo App do Motorista.
*   **Filtros de Movimentação:** Identificação rápida de veículos parados vs. em movimento.

### 7. BI & Performance (Business Intelligence)
*   **Análise Estratégica:** Gráficos avançados de lucratividade por cliente (transportadora).
*   **Ranking de Eficiência:** Identifica quais veículos e motoristas trazem o melhor resultado financeiro por KM rodado.

### 8. Cadastros & Configurações (Setup)
*   **Entidades:** Cadastro de Veículos (placa, eixos, modelo), transportadoras e locais.
*   **Regras de Negócio:** Personalização de taxas de impostos, custos base de pneus/km e manutenção/km para todo o sistema.

---

## 💳 Modelo de Monetização (Checkout Automático Próximo)
*   **Planos Escaláveis:** Piloto, Gestor Pro, Frota Elite.
*   **Frequência:** Mensal, Anual e Licença Vitalícia (Lifetime).
*   **Status de Pagamento:** Sistema integrado de Paywall que bloqueia funções avançadas (BI, Pneus) para usuários gratuitos.
*   **Próximo Passo:** Implementação de checkout automático para automatizar a upgrade de conta.

---

## 📱 Tecnologias Core
*   **Frontend/Backend:** Next.js (App Router).
*   **Banco de Dados:** Supabase.
*   **Autenticação:** Clerk.
*   **Estética:** UI Premium Dark Mode com Glassmorphism.
