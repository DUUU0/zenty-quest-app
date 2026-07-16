import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
// Certifique-se de que o seu hook 'useSubscription' seja compatível com React Native

type PremiumFeatureProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode; // Opcional: o que mostrar se ele NÃO for premium
};

export const PremiumFeature = ({ children, fallback = null }: PremiumFeatureProps) => {
    const { isActive, planName, loading } = useSubscription();

    // No React Native, retornar null é perfeitamente válido quando está carregando
    if (loading) return null;

    const premiumPlans = ["Premium mensal", "Premium anual"];
    const hasAccess = isActive && premiumPlans.includes(planName);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};