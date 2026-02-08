# 🚛 SISTEMA COMPLETO: Gestor vs Motorista

## 📋 VISÃO GERAL

Criei um **sistema dual** com duas interfaces completamente diferentes:

### 1. **Interface do GESTOR/DONO** (Dashboard Completo)
- Design premium com tema neural
- Gestão completa de motoristas
- Geração de links de acesso
- Monitoramento GPS em tempo real
- Aprovação de comprovantes
- Estatísticas avançadas

### 2. **Interface do MOTORISTA** (App Simples)
- Design mobile-first, simples e funcional
- GPS tracking
- Upload de comprovantes
- Iniciar/Finalizar viagens
- Ver ganhos
- Histórico

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **SQL para Criar Tabelas no Supabase:**

```sql
-- =====================================================
-- 1. ATUALIZAR TABELA DE MOTORISTAS
-- =====================================================
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS has_app_access BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_drivers_access_token ON drivers(access_token);
CREATE INDEX IF NOT EXISTS idx_drivers_has_access ON drivers(has_app_access);

-- =====================================================
-- 2. TABELA DE COMPROVANTES DE VIAGEM
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cte', 'nfe', 'receipt', 'fuel', 'toll', 'expense', 'delivery', 'loading')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('driver', 'manager')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2),
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trip_proofs_trip_id ON trip_proofs(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_proofs_approved ON trip_proofs(approved);
CREATE INDEX IF NOT EXISTS idx_trip_proofs_type ON trip_proofs(type);

-- RLS Policies
ALTER TABLE trip_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trip proofs"
  ON trip_proofs FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own trip proofs"
  ON trip_proofs FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own trip proofs"
  ON trip_proofs FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. STORAGE BUCKET PARA COMPROVANTES
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-proofs', 'trip-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy
CREATE POLICY "Users can upload trip proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-proofs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view trip proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trip-proofs' AND
    auth.role() = 'authenticated'
  );

-- =====================================================
-- 4. FUNÇÃO PARA GERAR TOKEN DE ACESSO
-- =====================================================
CREATE OR REPLACE FUNCTION generate_driver_access_token(driver_id UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := 'drv_' || driver_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  UPDATE drivers
  SET 
    has_app_access = TRUE,
    access_token = token
  WHERE id = driver_id;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNÇÃO PARA VALIDAR TOKEN DE MOTORISTA
-- =====================================================
CREATE OR REPLACE FUNCTION validate_driver_token(token TEXT)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  driver_phone TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.phone,
    (d.has_app_access AND d.access_token = token) AS is_valid
  FROM drivers d
  WHERE d.access_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VIEW PARA ESTATÍSTICAS DE MOTORISTAS
-- =====================================================
CREATE OR REPLACE VIEW driver_statistics AS
SELECT 
  d.id AS driver_id,
  d.name AS driver_name,
  d.has_app_access,
  d.last_login,
  COUNT(DISTINCT t.id) AS total_trips,
  COUNT(DISTINCT CASE WHEN t.status != 'Pago' THEN t.id END) AS active_trips,
  SUM(CASE WHEN t.status = 'Pago' THEN t.frete_seco + t.diarias ELSE 0 END) AS total_earned,
  MAX(t.departure_date) AS last_trip_date
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id
GROUP BY d.id, d.name, d.has_app_access, d.last_login;

-- =====================================================
-- 7. TRIGGER PARA ATUALIZAR LAST_LOGIN
-- =====================================================
CREATE OR REPLACE FUNCTION update_driver_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET last_login = NOW()
  WHERE access_token = NEW.access_token;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Não vou criar o trigger automaticamente pois depende de como você implementa o login
```

---

## 🎨 COMPONENTES CRIADOS

### **1. DriverApp.tsx** (Interface do Motorista)
```typescript
Funcionalidades:
✅ Home Dashboard
  - Boas-vindas personalizadas
  - Viagem ativa (se houver)
  - Ações rápidas
  - Estatísticas de comprovantes

✅ GPS Tracking
  - Rastreamento em tempo real
  - Status visual (ativo/pausado)
  - Instruções de uso

✅ Comprovantes
  - Upload de CT-e, NF-e, Combustível, Entrega
  - Lista de comprovantes enviados
  - Status de aprovação

✅ Ganhos
  - Saldo a receber
  - Total pago
  - Informações de pagamento (PIX)

✅ Bottom Navigation
  - 4 abas: Início, GPS, Docs, Ganhos
```

### **2. DriverManagement.tsx** (Interface do Gestor)
```typescript
Funcionalidades:
✅ Dashboard de Motoristas
  - Cards de estatísticas
  - Total, Ativos, Com Acesso, Em Viagem

✅ Lista de Motoristas
  - Status em tempo real (Online/Offline/Em Viagem)
  - Informações completas
  - Última visualização

✅ Gestão de Acesso
  - Gerar link de acesso único
  - Copiar link
  - Enviar via WhatsApp
  - Revogar acesso

✅ Monitoramento
  - Viagens ativas
  - Última localização
  - Estatísticas por motorista
```

### **3. DriverTracker.tsx** (GPS do Motorista)
```typescript
Funcionalidades:
✅ Rastreamento GPS
  - Localização em tempo real
  - Velocidade atual
  - Precisão do GPS
  - Nível de bateria

✅ Wake Lock
  - Mantém tela ligada
  - Economiza bateria

✅ Auto-update
  - Envia localização a cada 30s
  - Atualização automática
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO

### **Para o Gestor:**
```
1. Login normal (Clerk/Supabase)
2. Acessa Dashboard completo
3. Vai em "Gestão de Motoristas"
4. Gera link de acesso para motorista
```

### **Para o Motorista:**
```
1. Recebe link via WhatsApp
   Exemplo: app.ribeirxlog.com/driver/login?token=drv_123_456

2. Abre link no celular

3. Faz login automático com token

4. Vê interface simplificada do motorista

5. Adiciona à tela inicial (PWA)

6. Usa como app nativo
```

---

## 📱 ROTAS A CRIAR

### **1. `/driver/login` (Login do Motorista)**
```typescript
// app/driver/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DriverLogin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setError('Token inválido');
      setLoading(false);
    }
  }, [token]);

  const validateToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .rpc('validate_driver_token', { token });

      if (error || !data?.[0]?.is_valid) {
        setError('Token inválido ou expirado');
        return;
      }

      // Store driver session
      localStorage.setItem('driver_session', JSON.stringify({
        driverId: data[0].driver_id,
        driverName: data[0].driver_name,
        token,
      }));

      // Redirect to driver app
      router.push('/driver/app');
    } catch (err) {
      setError('Erro ao validar token');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Validando acesso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
```

### **2. `/driver/app` (App do Motorista)**
```typescript
// app/driver/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverApp from '@/components/DriverApp';
import { supabase } from '@/lib/supabase';

export default function DriverAppPage() {
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    const session = localStorage.getItem('driver_session');
    if (!session) {
      router.push('/driver/login');
      return;
    }

    const { driverId } = JSON.parse(session);

    // Load driver
    const { data: driverData } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    // Load current trip
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId)
      .neq('status', 'Pago')
      .order('departure_date', { ascending: false })
      .limit(1)
      .single();

    setDriver(driverData);
    setCurrentTrip(tripData);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_session');
    router.push('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <DriverApp 
      driver={driver} 
      currentTrip={currentTrip} 
      onLogout={handleLogout}
    />
  );
}
```

---

## 🚀 PRÓXIMOS PASSOS

### **1. Executar SQL no Supabase (5 min)**
- Copiar SQL acima
- Colar no SQL Editor do Supabase
- Executar

### **2. Criar Rotas (10 min)**
- Criar `/app/driver/login/page.tsx`
- Criar `/app/driver/app/page.tsx`

### **3. Adicionar Tab no Dashboard (2 min)**
- Adicionar "Motoristas" no Sidebar
- Importar `DriverManagement`

### **4. Testar (5 min)**
- Cadastrar motorista
- Gerar link de acesso
- Abrir no celular
- Testar funcionalidades

---

## 💡 FUNCIONALIDADES IMPLEMENTADAS

### **Gestor pode:**
✅ Ver todos os motoristas
✅ Gerar link de acesso único
✅ Copiar link
✅ Enviar via WhatsApp
✅ Revogar acesso
✅ Ver status em tempo real
✅ Ver viagens ativas
✅ Ver estatísticas

### **Motorista pode:**
✅ Fazer login com link
✅ Ver viagem ativa
✅ Iniciar GPS tracking
✅ Enviar comprovantes (CT-e, NF-e, etc.)
✅ Ver ganhos
✅ Ver histórico
✅ Finalizar viagem

---

## 🎯 DIFERENÇAS DE DESIGN

### **Interface do Gestor:**
- ✨ Tema neural premium
- 🎨 Animações complexas
- 📊 Gráficos e estatísticas
- 🖥️ Desktop-first
- 🌈 Cores vibrantes (emerald, sky, purple)

### **Interface do Motorista:**
- 🎯 Design simples e funcional
- 📱 Mobile-first
- 🔘 Botões grandes
- 🎨 Cores básicas
- ⚡ Performance otimizada

---

**Quer que eu crie as rotas e finalize a integração agora?** 🚀
