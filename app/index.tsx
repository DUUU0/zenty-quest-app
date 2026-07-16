import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { colors, radius } from '../src/constants/theme';
import UserService from '../src/services/UserService';

const features = [
    {
        icon: '🎯',
        title: 'Estudo Direcionado',
        text: 'Filtros inteligentes por banca (FUVEST, ENEM, UNICAMP), disciplina e nível de dificuldade.',
    },
    {
        icon: '📊',
        title: 'Métricas de Evolução',
        text: 'Gráficos de desempenho que mostram exatamente onde você precisa focar sua revisão.',
    },
    {
        icon: '⚡',
        title: 'Interface Fluida',
        text: 'Sem distrações ou anúncios. Um ambiente limpo projetado para o seu estado de flow.',
    },
];

export default function LandingPage() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [checking, setChecking] = useState(true);
    const isWide = width >= 700;

    useEffect(() => {
        async function checkSession() {
            const authenticated = await UserService.isAuthenticated();

            if (authenticated) {
                const isStudent = await UserService.isStudent();
                const isTeacher = await UserService.isTeacher();

                //if (isStudent) return router.replace('/(student)/dashboard');
                //if (isTeacher) return router.replace('/(teacher)/dashboard');
            }
            setChecking(false);
        }
        checkSession();
    }, []);

    if (checking) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.pageWrapper} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Header */}
            <View style={styles.navbar}>
                <Text style={styles.logo}>
                    Zenty<Text style={{ color: colors.primary }}>Quest</Text>
                </Text>

                <View style={styles.navLinks}>
                    <Link href="/login" asChild>
                        <TouchableOpacity style={styles.btnOutline}>
                            <Text style={styles.btnOutlineText}>Entrar</Text>
                        </TouchableOpacity>
                    </Link>
                    <Link href="/" asChild>
                        <TouchableOpacity style={styles.btnOutline}>
                            <Text style={styles.btnOutlineText}>Criar conta</Text>
                        </TouchableOpacity>
                    </Link>
                    <Link href="/" asChild>
                        <TouchableOpacity style={styles.btnOutline}>
                            <Text style={styles.btnOutlineText}>Suporte</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>🚀 Otimizado para vestibulares 2026</Text>
                </View>

                <Text style={styles.heroTitle}>
                    Estude com questões que{'\n'}
                    <Text style={{ color: colors.primary }}>realmente caem</Text> na prova
                </Text>

                <Text style={styles.heroText}>
                    Pare de perder tempo com conteúdo genérico. Acesse nosso banco de
                    questões organizado por vestibular, matéria e incidência.
                </Text>

                <View style={styles.ctaGroup}>
                    <Link href="/planos" asChild>
                        <TouchableOpacity style={styles.btnPrimary}>
                            <Text style={styles.btnPrimaryText}>Ver planos</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* Features */}
            <View style={styles.features}>
                <View style={[styles.grid, isWide && styles.gridWide]}>
                    {features.map((f, i) => (
                        <View
                            key={i}
                            style={[styles.featureCard, isWide && styles.featureCardWide]}
                        >
                            <View style={styles.iconBox}>
                                <Text style={{ fontSize: 24 }}>{f.icon}</Text>
                            </View>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureText}>{f.text}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    © 2026 ZentyQuest. Feito para estudantes, por estudantes.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    pageWrapper: {
        flex: 1,
        backgroundColor: colors.white,
    },
    navbar: {
        minHeight: 70,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        rowGap: 10,
    },
    logo: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textMain,
    },
    navLinks: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    btnOutline: {
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radius.sm,
    },
    btnOutlineText: {
        color: colors.textMain,
        fontWeight: '600',
        fontSize: 13,
    },
    hero: {
        paddingVertical: 50,
        paddingHorizontal: 24,
        alignItems: 'center',
        backgroundColor: '#f5f6ff',
    },
    badge: {
        backgroundColor: '#e0e7ff',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        color: colors.primaryDark,
        fontSize: 12,
        fontWeight: '600',
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: colors.textMain,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    heroText: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        maxWidth: 500,
        marginBottom: 30,
        lineHeight: 24,
    },
    ctaGroup: {
        width: '100%',
        alignItems: 'center',
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 50,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    btnPrimaryText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    features: {
        backgroundColor: colors.bgBody,
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    grid: {
        gap: 20,
    },
    gridWide: {
        flexDirection: 'row',
    },
    featureCard: {
        backgroundColor: colors.white,
        padding: 24,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    featureCardWide: {
        flex: 1,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: 8,
    },
    featureText: {
        color: colors.textLight,
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    footerText: {
        color: colors.textLight,
        fontSize: 13,
    },
});