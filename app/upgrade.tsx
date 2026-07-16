import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../src/constants/theme';

const benefits = [
    'Inteligência Artificial para gerar questões',
    'Exportação de listas em PDF ilimitada',
    'Filtros avançados por incidência em vestibulares',
    'Sem anúncios e interrupções',
];

export default function Upgrade() {
    const router = useRouter();

    return (
        <ScrollView contentContainerStyle={styles.bodyWrapper}>
            <Text style={styles.logo}>
                Zenty<Text style={{ color: colors.primary }}>Quest</Text>
            </Text>

            <View style={styles.badge}>
                <Feather name="lock" size={12} color={colors.primaryDark} />
                <Text style={styles.badgeText}>Funcionalidade Restrita</Text>
            </View>

            <Text style={styles.title}>
                Leve seus estudos para o{'\n'}
                <Text style={{ color: '#c026d3' }}>próximo nível</Text>
            </Text>

            <Text style={styles.subtitle}>
                Você tentou acessar um recurso exclusivo. Assine um de nossos planos e
                tenha acesso ilimitado a geradores de IA e exportação de listas.
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Por que ser Premium?</Text>

                {benefits.map((b) => (
                    <View key={b} style={styles.benefitRow}>
                        <Feather name="check-circle" size={16} color={colors.primary} />
                        <Text style={styles.benefitText}>{b}</Text>
                    </View>
                ))}

                <Link href="/planos" asChild>
                    <TouchableOpacity style={styles.btnPrimary}>
                        <Feather name="zap" size={16} color={colors.white} />
                        <Text style={styles.btnPrimaryText}>Ver planos disponíveis</Text>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity
                    style={styles.btnBack}
                    onPress={() => router.replace('/estudante/dashboardEstudante')}
                >
                    <Feather name="arrow-left" size={14} color={colors.textLight} />
                    <Text style={styles.btnBackText}>Voltar ao Dashboard</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bodyWrapper: {
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    logo: { fontSize: 24, fontWeight: '800', color: colors.textMain, marginBottom: 30 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryLight,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 24,
    },
    badgeText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textMain,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 16,
    },
    subtitle: {
        color: colors.textLight,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 420,
        marginBottom: 32,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: 24,
        gap: 4,
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textMain, marginBottom: 12 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    benefitText: { color: colors.textMain, fontSize: 14, flexShrink: 1 },
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: radius.sm,
        marginTop: 20,
    },
    btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    btnBack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
    },
    btnBackText: { color: colors.textLight, fontWeight: '600', fontSize: 13 },
});