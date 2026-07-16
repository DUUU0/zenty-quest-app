import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

const PREMIUM_PLANS = ["Premium mensal", "Premium anual"];

export function RequirePremium({ children }: { children: React.ReactNode }) {
    const { isActive, planName, loading } = useSubscription();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    const hasAccess = isActive === true && PREMIUM_PLANS.includes(planName);

    if (!hasAccess) {
        return <Redirect href="/upgrade" />;
    }

    return <>{children}</>;
}