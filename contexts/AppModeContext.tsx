import React, { createContext, useContext, useMemo } from 'react';
import { UserProfile } from '../types';

type AppMode = 'simple' | 'intermediate' | 'advanced' | 'custom';

interface FeatureFlags {
    canAccessTires: boolean;
    canAccessBI: boolean;
    canAccessFullMaintenance: boolean;
    canAccessSociety: boolean;
    canAccessFinanceComplex: boolean;
    canAccessDriverMgmt: boolean;
    canAutoValidateDocs: boolean;
    maxVehicles?: number; // New limit
    canAccessGPS?: boolean; // New feature
}

interface AppModeContextType {
    mode: AppMode;
    features: FeatureFlags;
    isSimpleMode: boolean;
    isAdvancedMode: boolean;
    uiStyle: 'minimal' | 'balanced' | 'neural' | 'deep';
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ profile: UserProfile, children: React.ReactNode }> = ({ profile, children }) => {
    const mode = profile.config.appMode || 'advanced'; // Default to advanced if not set
    const isAdmin = [
        'arthur@ribeirxlog.com',
        'arthur.ribeirx@gmail.com',
        'arthur.riberix@gmail.com',
        'arthurpsantos01@gmail.com',
        'arthur_ribeiro09@outlook.com'
    ].includes(profile.email?.trim().toLowerCase() || '');

    const isFree = profile.payment_status !== 'paid' && !isAdmin;
    const appPlan = isFree ? 'none' : (profile.plan_type || 'none');

    const customFeatures = profile.config.enabledFeatures || [];


    const features = useMemo(() => {
        let flags: FeatureFlags = {
            canAccessTires: false,
            canAccessBI: false,
            canAccessFullMaintenance: false,
            canAccessSociety: false,
            canAccessFinanceComplex: false,
            canAccessDriverMgmt: false,
            canAutoValidateDocs: false,
            canAccessGPS: false,
            maxVehicles: 1
        };

        switch (mode) {
            case 'simple':
                flags = {
                    canAccessTires: false,
                    canAccessBI: false, // Simple Dashboard only
                    canAccessFullMaintenance: false, // Checklist only
                    canAccessSociety: false,
                    canAccessFinanceComplex: false, // Basic Cashflow
                    canAccessDriverMgmt: false, // Auto-sets driver
                    canAutoValidateDocs: false
                };
                break;
            case 'intermediate':
                flags = {
                    canAccessTires: false,
                    canAccessBI: true, // Intermediate charts
                    canAccessFullMaintenance: true, // Basic history
                    canAccessSociety: false,
                    canAccessFinanceComplex: false,
                    canAccessDriverMgmt: true,
                    canAutoValidateDocs: true
                };
                break;
            case 'advanced':
                flags = {
                    canAccessTires: true,
                    canAccessBI: true,
                    canAccessFullMaintenance: true,
                    canAccessSociety: true,
                    canAccessFinanceComplex: true,
                    canAccessDriverMgmt: true,
                    canAutoValidateDocs: true
                };
                break;
            case 'custom':
                flags = {
                    canAccessTires: customFeatures.includes('tires'),
                    canAccessBI: customFeatures.includes('bi'),
                    canAccessFullMaintenance: customFeatures.includes('maintenance'),
                    canAccessSociety: customFeatures.includes('society'),
                    canAccessFinanceComplex: customFeatures.includes('finance'),
                    canAccessDriverMgmt: customFeatures.includes('drivers'),
                    canAutoValidateDocs: customFeatures.includes('docs')
                };
                break;
        }

        // ─── PLAN LIMITATIONS (Hard Override) ───
        if (appPlan === 'piloto' || appPlan === 'none') {
            // Piloto/None: Basic only, 1 truck, no GPS, no Tires
            flags.canAccessGPS = false;
            flags.maxVehicles = 1;
            flags.canAccessTires = false;
            flags.canAccessSociety = false;
            flags.canAccessBI = false;
            flags.canAccessFullMaintenance = false;
            flags.canAccessFinanceComplex = false;
        } else if (appPlan === 'gestor_pro' || appPlan === 'mensal' || appPlan === 'lifetime') {
            // Gestor Pro: Full access
            flags.canAccessGPS = true;
            flags.maxVehicles = 999;
            flags.canAccessTires = true;
            flags.canAccessBI = true;
            flags.canAccessFullMaintenance = true;
            flags.canAccessSociety = true;
            flags.canAccessFinanceComplex = true;
        } else if (appPlan === 'frota_elite' || appPlan === 'anual') {
            // Elite: Everything
            flags.canAccessGPS = true;
            flags.maxVehicles = 999;
            flags.canAccessTires = true;
            flags.canAccessBI = true;
            flags.canAccessFullMaintenance = true;
            flags.canAccessSociety = true;
            flags.canAccessFinanceComplex = true;
        }


        return flags;
    }, [mode, customFeatures, appPlan]);

    const uiStyle = useMemo((): 'minimal' | 'balanced' | 'neural' | 'deep' => {
        if (mode === 'simple') return 'minimal';
        if (mode === 'intermediate') return 'balanced';
        if (mode === 'advanced') return 'neural';
        return 'deep';
    }, [mode]);

    const value = {
        mode,
        features,
        isSimpleMode: mode === 'simple',
        isAdvancedMode: mode === 'advanced',
        uiStyle
    };

    return (
        <AppModeContext.Provider value={value}>
            {children}
        </AppModeContext.Provider>
    );
};

export const useAppMode = () => {
    const context = useContext(AppModeContext);
    if (!context) {
        throw new Error('useAppMode must be used within an AppModeProvider');
    }
    return context;
};
