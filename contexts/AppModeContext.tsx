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
}

interface AppModeContextType {
    mode: AppMode;
    features: FeatureFlags;
    isSimpleMode: boolean;
    isAdvancedMode: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ profile: UserProfile, children: React.ReactNode }> = ({ profile, children }) => {
    const mode = profile.config.appMode || 'advanced'; // Default to advanced if not set
    const customFeatures = profile.config.enabledFeatures || [];

    const features = useMemo(() => {
        let flags: FeatureFlags = {
            canAccessTires: false,
            canAccessBI: false,
            canAccessFullMaintenance: false,
            canAccessSociety: false,
            canAccessFinanceComplex: false,
            canAccessDriverMgmt: false,
            canAutoValidateDocs: false
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
        return flags;
    }, [mode, customFeatures]);

    const value = {
        mode,
        features,
        isSimpleMode: mode === 'simple',
        isAdvancedMode: mode === 'advanced'
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
