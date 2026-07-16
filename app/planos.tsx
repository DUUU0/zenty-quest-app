import { apiClient } from "@/src/services/api"; 
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Plan {
    id: number;
    name: string;
    price: number;
    description: string;
}

export default function PlanSelection() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const api = apiClient;

        api.get("/plans")
            .then(response => {
                setPlans(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar planos:", error);
                setLoading(false);
            });
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.bodyWrapper} showsVerticalScrollIndicator={false}>

                <View style={styles.backContainer}>
                    <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.btnOutlineText}>Voltar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.selectionWrapper}>
                    <View style={styles.selectionHeader}>
                        <Text style={styles.logo}>
                            Zenty<Text style={styles.logoHighlight}>Quest</Text>
                        </Text>
                        <Text style={styles.headerTitle}>Conheça nossos planos</Text>
                        <Text style={styles.headerSubtitle}>
                            Escolha a melhor opção para impulsionar seus estudos quando quiser.
                        </Text>
                    </View>

                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={styles.loaderText}>Carregando planos...</Text>
                        </View>
                    ) : (
                        <View style={styles.plansGrid}>
                            {plans.map((plan) => (
                                <View key={plan.id} style={styles.planCardStatic}>
                                    <Text style={styles.cardTitle}>{plan.name}</Text>

                                    <View style={styles.priceContainer}>
                                        <Text style={styles.currency}>R$</Text>
                                        <Text style={styles.price}>
                                            {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>

                                    <Text style={styles.cardDescription}>{plan.description}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.btnMain}
                            activeOpacity={0.8}
                            // Mude 'Cadastro' para o nome exato da sua rota
                            onPress={() => navigation.navigate('Cadastro' as never)}
                        >
                            <Text style={styles.btnMainText}>Criar minha conta agora</Text>
                        </TouchableOpacity>

                        <View style={styles.loginTextContainer}>
                            <Text style={styles.loginText}>Já tem uma conta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                                <Text style={styles.loginLink}>Fazer login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* --- Estilos --- */
const COLORS = {
    primary: '#4F46E5',
    primaryDark: '#4338ca',
    textMain: '#1f2937',
    textLight: '#6b7280',
    bgLight: '#f9fafb',
    white: '#ffffff',
    border: '#f3f4f6',
    borderDark: '#e5e7eb',
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bgLight,
    },
    bodyWrapper: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    backContainer: {
        width: '100%',
        marginBottom: 30,
        alignItems: 'flex-start',
    },
    btnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    btnOutlineText: {
        color: COLORS.textMain,
        fontWeight: '600',
        fontSize: 14,
    },
    selectionWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    selectionHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 15,
        color: COLORS.textMain,
        letterSpacing: -1,
    },
    logoHighlight: {
        color: COLORS.primary,
    },
    headerTitle: {
        fontSize: 26, // Adaptado para telas mobile
        color: COLORS.textMain,
        marginBottom: 12,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    headerSubtitle: {
        color: COLORS.textLight,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    plansGrid: {
        width: '100%',
        marginBottom: 40,
    },
    planCardStatic: {
        backgroundColor: COLORS.white,
        paddingVertical: 35,
        paddingHorizontal: 25,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        marginBottom: 20,
        // Sombras
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 22,
        color: COLORS.textMain,
        marginBottom: 20,
        fontWeight: '700',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    currency: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 4,
        color: COLORS.textLight,
    },
    price: {
        fontSize: 40,
        fontWeight: '900',
        color: COLORS.textMain,
        letterSpacing: -1,
    },
    cardDescription: {
        fontSize: 15,
        color: COLORS.textLight,
        lineHeight: 24,
        textAlign: 'center',
    },
    loaderContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    actionContainer: {
        width: '100%',
        alignItems: 'center',
    },
    btnMain: {
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 5,
    },
    btnMainText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    loginTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        color: COLORS.textLight,
        fontSize: 15,
    },
    loginLink: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 15,
    },
});