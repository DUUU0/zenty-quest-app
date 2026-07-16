// src/hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../services/api'; // Ajuste o caminho conforme sua estrutura

export function useSubscription() {
    const [subscription, setSubscription] = useState({
        isActive: false,
        planName: 'Gratuito',
        endDate: null,
        status: null,
        loading: true
    });

    useEffect(() => {
        async function loadStatus() {
            try {
                // 1. Busca dados do usuário atual
                const userRes = await apiClient.get('/users/me');
                const userId = userRes.data.id;

                // 2. Busca a assinatura mais recente
                const response = await apiClient.get(`/subscriptions/latest-expiry/${userId}`);

                if (response.status === 200 && response.data) {
                    const data = response.data;

                    // Lógica de validação de período e status
                    const today = new Date();
                    const expiryDate = new Date(data.endDate);
                    const isWithinPeriod = today <= expiryDate;
                    const isApproved = data.status === 'approved';

                    setSubscription({
                        isActive: isApproved && isWithinPeriod,
                        planName: data.planName,
                        endDate: data.endDate,
                        status: data.status,
                        loading: false
                    });
                } else {
                    // Caso 204 No Content (sem assinaturas)
                    setSubscription(prev => ({ ...prev, loading: false }));
                }
            } catch (error) {
                console.error("Erro ao validar acesso:", error);
                setSubscription(prev => ({ ...prev, loading: false }));
            }
        }

        loadStatus();
    }, []);

    return subscription;
}