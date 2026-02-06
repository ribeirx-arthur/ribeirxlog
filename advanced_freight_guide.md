# Guia Técnico: Implementação da Calculadora de Frete Ribeirx (Elite)

Este documento detalha o passo a passo para transformar a calculadora atual em uma ferramenta de precisão cirúrgica para o mercado de transporte.

---

## 1. Roteirização Especializada (Caminhão vs Carro)
O Google Maps padrão é ótimo para carros, mas para um SaaS de elite, ele é perigoso porque não conhece restrições de **ZMRC (Zonas de Restrição em São Paulo)**, pontes baixas ou limites de peso.

### Ferramentas Recomendadas:
1.  **Maplink API (Líder no Brasil):** A melhor para o mercado brasileiro. Já conhece todas as restrições de caminhões e zonas de rodízio/restrição das capitais.
2.  **HERE Routing API (Padrão Global):** Utilizada pelas maiores transportadoras do mundo. Possui perfis específicos para caminhões (altura, largura, peso por eixo e materiais perigosos).

### Passo a Passo:
*   **Perfil do Veículo:** Ao enviar a rota para a API, enviamos o "Truck Profile" com os dados que já temos no Ribeirx (número de eixos e peso total).
*   **Evitar Restrições:** A API retornará uma rota que pode ser mais longa que a do Google, mas é a **única rota legal** onde o caminhão pode passar sem levar multa.

---

## 2. Automação de Pedágios (Riscos Zero)
Pedágios podem representar até 15% do custo. Nunca deixe isso na mão do usuário.

### Ferramentas Recomendadas:
*   **Maplink** ou **TollGuru** (Ambas possuem excelente cobertura no Brasil).

### Lógica de Integração:
1.  O sistema envia a **rota (polyline)** e o **número de eixos** do caminhão para a API.
2.  A API retorna o valor detalhado de cada praça de pedágio no caminho.
3.  O Ribeirx Log injeta esse valor no campo `tolls` de forma imutável.

---

## 3. Compliance com ANTT (Segurança Jurídica)
Evitar que a transportadora cobre abaixo do piso mínimo estipulado por lei.

### Fluxo de Aplicação:
1.  **Consumo de Dados:** Criar um serviço que lê a tabela de [Piso Mínimo de Frete da ANTT](https://www.gov.br/antt/pt-br/assuntos/cargas/gerenciamento-do-piso-minimo-do-frete).
2.  **Validação:** No cálculo final, o sistema deve comparar o `suggestedFreight` com o `minimoANTT`.
3.  **Alerta Visual:** Se o valor estiver abaixo, exibir um banner: ⚠️ *"Atenção: Este frete está abaixo do piso mínimo legal da ANTT (R$ X)"*.

---

## 4. Matriz de Custos de Desvalorização (Manutenção Preventiva)
O segredo para um SaaS de elite é prever o futuro financeiro da frota.

### Itens para a "Fórmula Secreta":
*   **Depreciação de Pneus:** Dividir o valor do jogo de pneus pela vida útil estimada (ex: 80.000km). Somar esse "Custo por KM" ao frete.
*   **Seguro de Carga (RCTR-C):** Adicionar um campo para o valor da carga e calcular automaticamente o % do seguro.
*   **Arla 32:** Incluir a proporção de Arla em relação ao Diesel (geralmente 5%).

---

## 5. Cotação Profissional (WhatsApp)
O fechamento da venda do frete.

1.  **Página de Visualização:** Criar uma página `/quote/[id]` que o cliente do seu cliente acessa.
2.  **Design:** Deve conter a logo da transportadora, o detalhamento da rota e o valor final.
3.  **Call to Action:** Botão "Aceitar Cotação" que notifica o dono da transportadora via e-mail/push.

---

Implementando esses pontos, o **Ribeirx Log** deixa de ser apenas uma calculadora e se torna uma **Autoridade Financeira Logística**.
