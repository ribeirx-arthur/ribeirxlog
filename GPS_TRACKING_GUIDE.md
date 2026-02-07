# 🗺️ GUIA COMPLETO: Implementação de GPS Tracking no Ribeirx Log

## 📋 ÍNDICE
1. [Visão Geral das Opções](#visão-geral)
2. [Opção 1: GPS Simulado (MVP)](#opção-1-gps-simulado-mvp)
3. [Opção 2: Integração com Rastreadores Comerciais](#opção-2-integração-com-rastreadores)
4. [Opção 3: App Mobile Nativo](#opção-3-app-mobile-nativo)
5. [Comparação de Custos](#comparação-de-custos)
6. [Roadmap de Implementação](#roadmap)

---

## 🎯 VISÃO GERAL DAS OPÇÕES

| Característica | Opção 1: Simulado | Opção 2: Rastreadores | Opção 3: App Mobile |
|---|---|---|---|
| **Tempo de Implementação** | 2-3 horas | 1-2 semanas | 4-6 semanas |
| **Custo Inicial** | R$ 0 | R$ 0 (API grátis) | R$ 5.000-10.000 |
| **Custo Mensal por Veículo** | R$ 0 | R$ 50-150 | R$ 0 |
| **Precisão** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Confiabilidade** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Dependência de Hardware** | Não | Sim | Não |
| **Ideal Para** | MVP/Demo | Clientes Enterprise | Pequenos Transportadores |

---

## 🚀 OPÇÃO 1: GPS SIMULADO (MVP)

### ✅ **RECOMENDADO PARA COMEÇAR**

**Conceito:** Usar o GPS do smartphone do motorista para enviar localização.

### **Arquitetura:**

```
┌─────────────────┐
│  Smartphone     │
│  (Motorista)    │
│                 │
│  ┌───────────┐  │
│  │ Web App   │  │ ← Abre no navegador
│  │ Simples   │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         │ POST /api/gps/location
         │ { lat, lng, speed, heading }
         ▼
┌─────────────────┐
│   Supabase      │
│   Database      │
│                 │
│  vehicle_       │
│  locations      │
└────────┬────────┘
         │
         │ Real-time subscription
         ▼
┌─────────────────┐
│  Dashboard      │
│  (Gestor)       │
│                 │
│  Mapa com       │
│  posições       │
└─────────────────┘
```

### **Implementação Passo a Passo:**

#### **1. Criar Tabela no Supabase**

```sql
-- Execute no SQL Editor do Supabase
CREATE TABLE vehicle_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  accuracy DECIMAL(6, 2) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  address TEXT,
  altitude DECIMAL(7, 2),
  battery_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX idx_vehicle_locations_timestamp ON vehicle_locations(timestamp DESC);
CREATE INDEX idx_vehicle_locations_trip_id ON vehicle_locations(trip_id);

-- RLS Policies
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicle locations"
  ON vehicle_locations FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM vehicles WHERE id = vehicle_id
  ));

CREATE POLICY "Users can insert their own vehicle locations"
  ON vehicle_locations FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM vehicles WHERE id = vehicle_id
  ));

-- Tabela de Alertas GPS
CREATE TABLE gps_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('speed_limit', 'geofence_exit', 'stop_too_long', 'route_deviation', 'offline')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gps_alerts_vehicle_id ON gps_alerts(vehicle_id);
CREATE INDEX idx_gps_alerts_resolved ON gps_alerts(resolved);

ALTER TABLE gps_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gps alerts"
  ON gps_alerts FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM vehicles WHERE id = vehicle_id
  ));
```

#### **2. Criar App Web Simples para Motorista**

```typescript
// components/DriverGPSTracker.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DriverGPSTrackerProps {
  vehicleId: string;
  tripId?: string;
}

const DriverGPSTracker: React.FC<DriverGPSTrackerProps> = ({ vehicleId, tripId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTracking) return;

    const sendLocation = async (position: GeolocationPosition) => {
      try {
        const { error } = await supabase.from('vehicle_locations').insert({
          vehicle_id: vehicleId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s to km/h
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          trip_id: tripId,
          timestamp: new Date().toISOString(),
        });

        if (error) throw error;
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError('Erro ao enviar localização');
        console.error(err);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      sendLocation,
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Send location every 30 seconds
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation);
    }, 30000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [isTracking, vehicleId, tripId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-2">Rastreamento GPS</h1>
          <p className="text-slate-400">Ribeirx Log Driver</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isTracking ? 'bg-emerald-500/20 animate-pulse' : 'bg-slate-800'
            }`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold mb-2">
              {isTracking ? 'Rastreamento Ativo' : 'Rastreamento Pausado'}
            </p>
            {lastUpdate && (
              <p className="text-sm text-slate-400">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
              isTracking
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isTracking ? 'Pausar Rastreamento' : 'Iniciar Rastreamento'}
          </button>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>• Mantenha o app aberto durante a viagem</p>
            <p>• Localização enviada a cada 30 segundos</p>
            <p>• Requer GPS ativado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverGPSTracker;
```

#### **3. Integrar Mapa no Dashboard**

**Opções de Biblioteca de Mapas:**

**A) Leaflet (GRÁTIS - RECOMENDADO)**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**B) Google Maps (Pago após 28k carregamentos/mês)**
```bash
npm install @react-google-maps/api
```

**C) Mapbox (Grátis até 50k carregamentos/mês)**
```bash
npm install mapbox-gl react-map-gl
```

**Exemplo com Leaflet:**

```typescript
// components/GPSMap.tsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface GPSMapProps {
  locations: VehicleLocation[];
  vehicles: Vehicle[];
  center?: [number, number];
  zoom?: number;
}

const GPSMap: React.FC<GPSMapProps> = ({ 
  locations, 
  vehicles, 
  center = [-23.5505, -46.6333], 
  zoom = 12 
}) => {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => {
        const vehicle = vehicles.find(v => v.id === location.vehicleId);
        return (
          <Marker 
            key={location.id} 
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{vehicle?.plate}</p>
                <p>Velocidade: {location.speed.toFixed(0)} km/h</p>
                <p>Atualizado: {new Date(location.timestamp).toLocaleTimeString('pt-BR')}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default GPSMap;
```

---

## 🏢 OPÇÃO 2: INTEGRAÇÃO COM RASTREADORES COMERCIAIS

### **Principais Fornecedores no Brasil:**

1. **Onixsat** (Líder de mercado)
2. **Sascar** (Grupo Michelin)
3. **Autotrac** (Vivo)
4. **Omnilink** (Claro)
5. **Pointer** (Econômico)

### **Como Funciona:**

```
┌──────────────┐
│  Rastreador  │ ← Hardware instalado no veículo
│  GPS/GPRS    │
└──────┬───────┘
       │
       │ Envia dados via GPRS/3G/4G
       ▼
┌──────────────┐
│  Servidor    │
│  Onixsat     │
│  (Exemplo)   │
└──────┬───────┘
       │
       │ API REST
       │ GET /api/v1/vehicles/{id}/location
       ▼
┌──────────────┐
│  Ribeirx Log │
│  Backend     │
└──────┬───────┘
       │
       │ Armazena no Supabase
       ▼
┌──────────────┐
│  Dashboard   │
└──────────────┘
```

### **Exemplo de Integração (Onixsat):**

```typescript
// services/onixsatIntegration.ts
import axios from 'axios';

interface OnixsatConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export class OnixsatGPSService {
  private config: OnixsatConfig;

  constructor(config: OnixsatConfig) {
    this.config = config;
  }

  async getVehicleLocation(vehicleExternalId: string) {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/v1/vehicles/${vehicleExternalId}/location`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        speed: response.data.speed,
        heading: response.data.heading,
        timestamp: response.data.timestamp,
        ignition: response.data.ignition,
        batteryVoltage: response.data.battery,
      };
    } catch (error) {
      console.error('Erro ao buscar localização Onixsat:', error);
      throw error;
    }
  }

  async getVehicleHistory(vehicleExternalId: string, startDate: Date, endDate: Date) {
    const response = await axios.get(
      `${this.config.baseUrl}/api/v1/vehicles/${vehicleExternalId}/history`,
      {
        params: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    return response.data.locations;
  }
}

// Uso:
const onixsat = new OnixsatGPSService({
  apiKey: process.env.ONIXSAT_API_KEY!,
  apiSecret: process.env.ONIXSAT_API_SECRET!,
  baseUrl: 'https://api.onixsat.com.br',
});

// Sincronizar a cada 1 minuto
setInterval(async () => {
  const vehicles = await getVehiclesWithTracker();
  
  for (const vehicle of vehicles) {
    const location = await onixsat.getVehicleLocation(vehicle.trackerExternalId);
    
    await supabase.from('vehicle_locations').insert({
      vehicle_id: vehicle.id,
      ...location,
    });
  }
}, 60000);
```

### **Custos Estimados:**

| Fornecedor | Hardware | Mensalidade | Instalação |
|---|---|---|---|
| Onixsat | R$ 400-600 | R$ 80-120 | R$ 150-300 |
| Sascar | R$ 500-800 | R$ 100-150 | R$ 200-400 |
| Autotrac | R$ 350-550 | R$ 70-100 | R$ 150-250 |
| Pointer | R$ 250-400 | R$ 50-80 | R$ 100-200 |

---

## 📱 OPÇÃO 3: APP MOBILE NATIVO

### **Stack Recomendado:**

- **React Native** (código compartilhado iOS + Android)
- **Expo** (facilita desenvolvimento)
- **Background Geolocation** (rastreamento em segundo plano)

### **Implementação:**

```bash
# Criar projeto
npx create-expo-app ribeirx-driver
cd ribeirx-driver

# Instalar dependências
npm install expo-location expo-task-manager
npm install @supabase/supabase-js
```

```typescript
// App.tsx (React Native)
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './lib/supabase';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    // Enviar para Supabase
    await supabase.from('vehicle_locations').insert({
      vehicle_id: vehicleId, // Pegar do AsyncStorage
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speed: location.coords.speed * 3.6,
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      timestamp: new Date(location.timestamp).toISOString(),
    });
  }
});

export default function App() {
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão de localização negada');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      alert('Permissão de localização em segundo plano negada');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 segundos
      distanceInterval: 100, // 100 metros
      foregroundService: {
        notificationTitle: 'Ribeirx Log',
        notificationBody: 'Rastreamento GPS ativo',
      },
    });

    setIsTracking(true);
  };

  const stopTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsTracking(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ribeirx Driver</Text>
      <Text style={styles.status}>
        {isTracking ? '🟢 Rastreamento Ativo' : '🔴 Rastreamento Pausado'}
      </Text>
      <Button
        title={isTracking ? 'Parar' : 'Iniciar'}
        onPress={isTracking ? stopTracking : startTracking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 40,
  },
});
```

---

## 💰 COMPARAÇÃO DE CUSTOS (12 MESES)

### **Para 10 Veículos:**

| Opção | Custo Inicial | Custo Mensal | Total 12 Meses |
|---|---|---|---|
| **Opção 1: Simulado** | R$ 0 | R$ 0 | **R$ 0** |
| **Opção 2: Onixsat** | R$ 5.000 | R$ 1.000 | **R$ 17.000** |
| **Opção 3: App Mobile** | R$ 8.000 | R$ 0 | **R$ 8.000** |

---

## 🗺️ ROADMAP RECOMENDADO

### **FASE 1: MVP (Semana 1-2)** ✅ JÁ CRIADO
- [x] Componente GPSTracking.tsx
- [x] Tipos TypeScript
- [ ] Tabelas Supabase
- [ ] App web simples para motorista
- [ ] Integração com Leaflet

### **FASE 2: Produção (Semana 3-4)**
- [ ] App mobile React Native
- [ ] Notificações push
- [ ] Alertas automáticos
- [ ] Geocoding reverso (endereço)

### **FASE 3: Enterprise (Mês 2-3)**
- [ ] Integração com rastreadores
- [ ] Geofencing (cercas virtuais)
- [ ] Histórico de rotas
- [ ] Relatórios de km rodado

---

## 🎯 MINHA RECOMENDAÇÃO

**Comece com Opção 1 (Simulado) AGORA:**
1. ✅ Componente já criado
2. ✅ Tipos já definidos
3. ⏳ Criar tabelas no Supabase (5 min)
4. ⏳ Integrar Leaflet (30 min)
5. ⏳ Criar página para motorista (1 hora)

**Depois migre para Opção 3 (App Mobile):**
- Quando tiver 5+ clientes pagantes
- Investimento de R$ 8.000 se paga em 3 meses

**Opção 2 (Rastreadores) apenas para clientes Enterprise:**
- Ofereça como add-on premium
- Cobre R$ 150/mês por veículo
- Lucro: R$ 70/veículo/mês

---

**Quer que eu implemente a Opção 1 completa agora?** Posso criar as tabelas no Supabase e integrar o mapa com Leaflet em poucos minutos! 🚀
