# Changelog - Onboarding & Alertas

## 🚀 Novas Funcionalidades

### 1. Onboarding de Novos Usuários
Implementamos um fluxo de boas-vindas para novos usuários que ainda não configuraram o perfil.
- **Guiado e Simples:** Passo a passo para configurar Transportadora, Primeiro Veículo e Motorista.
- **Gamificação:** Barra de progresso e visual engajador.
- **Integração:** Os dados são salvos automaticamente no banco de dados e o usuário já começa com o sistema populado.

### 2. Sistema de Alertas de CNH
Agora o sistema monitora ativamente a validade da CNH dos motoristas cadastrados.
- **Notificações:** Alertas no "Sininho" quando uma CNH vence, ou está próxima de vencer (30 e 60 dias).
- **Indicador Visual:** Na tela de **Gestão de Motoristas**, um badge (etiqueta) aparece ao lado do nome do motorista:
  - 🔴 **CNH VENCIDA** (Vermelho piscante)
  - 🟡 **Vence em breve** (Amarelo)
  - 🟢 **Em dia** (Verde/Invisível)

### 3. Melhorias na Landing Page
- **Prova Social:** Adicionamos uma seção de depoimentos reais para aumentar a credibilidade e conversão.
- **Calculadora:** Destaque para a funcionalidade de cálculo de frete inteligente.

## 🛠️ Detalhes Técnicos
- Atualização no `app/page.tsx` para gerenciar o estado de onboarding.
- Novos tipos no `types.ts` para suportar configurações de usuário.
- Refatoração do `DriverManagement.tsx` para incluir feedback visual de status.

## ✅ Próximos Passos Sugeridos
1. Testar o fluxo de onboarding criando uma nova conta (ou resetando o campo `onboardingCompleted` no banco).
2. Verificar se os alertas aparecem corretamente alterando a data de validade de uma CNH para o passado.
