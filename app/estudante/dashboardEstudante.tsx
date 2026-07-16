import { apiClient } from '@/src/services/api';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

const colors = {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: 'rgba(79, 70, 229, 0.1)',
    textMain: '#111827',
    textLight: '#6b7280',
    white: '#ffffff',
    bgBody: '#f9fafb',
    danger: '#ef4444',
    success: '#10b981',
    border: '#e5e7eb',
    orangeIcon: '#f97316',
    orangeBg: '#fff7ed',
    blueIcon: '#3b82f6',
    blueBg: '#eff6ff',
    greenIcon: '#22c55e',
    greenBg: '#f0fdf4',
};

interface DashboardStats {
    totalAnswered: number;
    totalCorrect: number;
    totalErrors: number;
    accuracyRate: string;
    totalSimulados: number;
}

export default function DashboardEstudante() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalAnswered: 0,
        totalCorrect: 0,
        totalErrors: 0,
        accuracyRate: '0',
        totalSimulados: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);

            const [resSimulados, resErrors, resUser] = await Promise.all([
                apiClient.get('/userLists/simulados'),
                apiClient.get('/questions/my-errors'),
                apiClient.get('/users/me')
            ]);

            const totalSimulados = resSimulados.data?.length || 0;
            const totalErrors = resErrors.data?.length || 0;
            setUserName(resUser.data?.name?.split(' ')[0] || 'Estudante');

            setStats(prev => ({
                ...prev,
                totalErrors: totalErrors,
                totalSimulados: totalSimulados,
                totalAnswered: totalErrors,
                accuracyRate: totalErrors > 0 ? '---' : '100'
            }));

        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Erro ao carregar dados do dashboard.'
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView
            contentContainerStyle={styles.bodyWrapper}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topHeader}>
                <Text style={styles.welcomeText}>Bem-vindo, {userName}! 🚀</Text>
                <Text style={styles.subtitleText}>Veja como está seu desempenho hoje.</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Carregando estatísticas...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {/* Grid de Cards de Estatísticas */}
                    <View style={styles.dashboardGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: colors.orangeBg }]}>
                                <Feather name="x-circle" size={24} color={colors.orangeIcon} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Erros Pendentes</Text>
                                <Text style={styles.statValue}>{stats.totalErrors}</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: colors.blueBg }]}>
                                <Feather name="target" size={24} color={colors.blueIcon} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Simulados Ativos</Text>
                                <Text style={styles.statValue}>{stats.totalSimulados}</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: colors.greenBg }]}>
                                <Feather name="check-circle" size={24} color={colors.greenIcon} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Desempenho</Text>
                                <Text style={styles.statValue}>
                                    {stats.totalErrors === 0 ? 'Excelente' : 'Em evolução'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Seção de Ações Sugeridas */}
                    <View style={styles.quickActions}>
                        <Text style={styles.sectionTitle}>Ações Sugeridas</Text>

                        <View style={styles.actionButtons}>
                            {/* Corrigido o caminho do Href para apontar para o App */}
                            <Link href="/" asChild>
                                <TouchableOpacity style={styles.actionCard}>
                                    <View>
                                        <Text style={styles.actionCardTitle}>Limpar Erros</Text>
                                        <Text style={styles.actionCardSubtitle}>
                                            Você tem {stats.totalErrors} questões para revisar
                                        </Text>
                                    </View>
                                    <Feather name="arrow-right" size={20} color={colors.white} />
                                </TouchableOpacity>
                            </Link>

                            <Link href="/" asChild>
                                <TouchableOpacity style={[styles.actionCard, styles.actionCardDark]}>
                                    <View>
                                        <Text style={styles.actionCardTitle}>Novo Treino</Text>
                                        <Text style={styles.actionCardSubtitle}>Explorar o banco de questões</Text>
                                    </View>
                                    <Feather name="arrow-right" size={20} color={colors.white} />
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bodyWrapper: {
        flexGrow: 1,
        backgroundColor: colors.bgBody,
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    topHeader: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textMain,
    },
    subtitleText: {
        color: colors.textLight,
        fontSize: 14,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    loadingText: {
        marginTop: 12,
        color: colors.textLight,
        fontWeight: '500',
    },
    content: {
        width: '100%',
    },
    dashboardGrid: {
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statInfo: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: colors.textLight,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textMain,
        marginTop: 2,
    },
    quickActions: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textMain,
        marginBottom: 16,
    },
    actionButtons: {
        gap: 16,
    },
    actionCard: {
        backgroundColor: colors.primary,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    actionCardDark: {
        backgroundColor: colors.textMain,
        shadowColor: '#000',
    },
    actionCardTitle: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    actionCardSubtitle: {
        color: colors.white,
        fontSize: 13,
        opacity: 0.85,
    },
});