import { NextRequest, NextResponse } from 'next/server';
import { getStrategicAIAdvice } from '../../../../services/aiAnalysis';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { trips, vehicles, drivers, profile, messages } = body;
        
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            return NextResponse.json({ 
                error: 'Sua chave do Gemini não está configurada no .env.local' 
            }, { status: 400 });
        }

        const advice = await getStrategicAIAdvice(trips, vehicles, drivers, profile, apiKey, messages);

        return NextResponse.json({ advice });
    } catch (error: any) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
