import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAIContext, serializeContextToPrompt } from '../../../../services/buildAIContext';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, contextString, goalTitle, goalDescription, currentStep, userNote } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            return NextResponse.json({ error: 'GEMINI_API_KEY não configurada.' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const contextBlock = contextString || '';

        let prompt = '';

        if (action === 'generate_plan') {
            prompt = `Você é um consultor de negócios especialista em logística e empreendedorismo brasileiro.

Abaixo está o perfil COMPLETO e pré-calculado do operador. Esses dados são REAIS, vindos do sistema de gestão dele.
Use TODOS esses dados para criar um plano personalizado e realista.

${contextBlock}

META QUE O USUÁRIO QUER ALCANÇAR: "${goalTitle}"
Contexto adicional do usuário: "${goalDescription || 'Não informado'}"

Com base nos dados REAIS acima, gere um plano de ação DETALHADO com todos os passos necessários.
Seja específico: mencione valores baseados no fluxo de caixa real, prazos plausíveis dado o ritmo de trabalho.

Retorne SOMENTE um JSON válido, sem markdown, sem backticks:
{
  "steps": [
    {
      "order": 1,
      "title": "Título curto do passo",
      "description": "Explicação detalhada. Mencione valores reais quando relevante.",
      "actionTip": "Dica prática e rápida",
      "estimatedValue": 500
    }
  ],
  "summary": "Resumo motivacional em 2 frases, mencionando o nome do usuário e sua realidade atual"
}

Regras:
- Máximo 12 passos, mínimo 5
- Use os dados reais (lucro, fluxo de caixa, veículos) para calibrar valores e prazos
- Mencione se o fluxo de caixa atual suporta a meta, e se não, o que precisa mudar
- Foco no contexto brasileiro (Simples Nacional, DETRAN, ANTT, Receita Federal)
- Se o fluxo de caixa for negativo, o primeiro passo deve ser endereçar isso`;

        } else if (action === 'coach_advance') {
            prompt = `Você é o coach pessoal no RibeirxLog.

${contextBlock}

META ATUAL: "${goalTitle}"
PASSO RECÉM CONCLUÍDO: "${currentStep?.title}"
DESCRIÇÃO DO PASSO: "${currentStep?.description}"
OBSERVAÇÃO DO USUÁRIO: "${userNote || 'Nenhuma observação'}"

Escreva uma mensagem de parabéns curta (2-3 linhas), mencionando o transportador pelo nome, ou apenas como "Parceiro" se não souber o nome, e,
se relevante, faça um comentário sobre como esse passo impacta o fluxo de caixa ou os objetivos.
Apresente uma pequena dica de transição para o próximo passo.
Português, pessoal e motivador. Máximo 150 palavras.`;
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (action === 'generate_plan') {
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanedText);
            return NextResponse.json(parsed);
        }

        return NextResponse.json({ message: text });
    } catch (error: any) {
        console.error('Goals API System Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown internal error' }, { status: 500 });
    }
}
