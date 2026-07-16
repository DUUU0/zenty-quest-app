import { apiClient } from '@/src/services/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SuporteAluno() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                setLoading(true);
                const res = await apiClient.get('/users/me');
                setUserName(res.data.name || res.data.nome || 'Estudante');
            } catch (err) {
                console.error("Erro ao carregar usuário", err);
                // Fallback local se a API não estiver respondendo
                setUserName('Estudante');
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    // Função para abrir o e-mail padrão do aparelho
    const handleEmailPress = () => {
        Linking.openURL('mailto:eduardo.machado2505@gmail.com').catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
        });
    };

    // Função para abrir o WhatsApp diretamente
    const handleWhatsAppPress = () => {
        Linking.openURL('https://wa.me/5544997133936').catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Central de Suporte</Text>
                    <Text style={styles.headerSubtitle}>
                        Precisa de ajuda? Nossa equipe está pronta para te atender.
                    </Text>
                </View>
            </View>

            {/* Grid de Canais de Suporte */}
            <View style={styles.supportGrid}>

                {/* Card do Email */}
                <View style={styles.supportCard}>
                    <View style={[styles.iconBox, styles.blueIconBox]}>
                        <Feather name="mail" size={32} color="#4338ca" />
                    </View>
                    <Text style={styles.cardTitle}>E-mail</Text>
                    <Text style={styles.cardDescription}>
                        Envie suas dúvidas ou sugestões de melhoria.
                    </Text>
                    <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
                        <Text style={styles.contactButtonText}>eduardo.machado2505@gmail.com</Text>
                    </TouchableOpacity>
                </View>

                {/* Card do WhatsApp */}
                <View style={styles.supportCard}>
                    <View style={[styles.iconBox, styles.greenIconBox]}>
                        <Feather name="message-circle" size={32} color="#15803d" />
                    </View>
                    <Text style={styles.cardTitle}>WhatsApp & Telefone</Text>
                    <Text style={styles.cardDescription}>
                        Atendimento rápido para problemas técnicos ou acesso.
                    </Text>
                    <TouchableOpacity style={styles.contactButton} onPress={handleWhatsAppPress}>
                        <Text style={styles.contactButtonText}>(44) 99713-3936</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Horário de Atendimento */}
            <View style={styles.horarioCard}>
                <Feather name="clock" size={24} color="#6b7280" />
                <View style={styles.horarioTextContainer}>
                    <Text style={styles.horarioTitle}>Horário de Atendimento</Text>
                    <Text style={styles.horarioSubtitle}>Segunda a Sexta, das 08:00 às 18:00.</Text>
                </View>
            </View>

        </ScrollView>
    );
}

// Estilizações convertidas de SCSS para StyleSheet Nativo (Mobile-first)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 32,
        marginTop: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        lineHeight: 20,
    },
    supportGrid: {
        gap: 20,
        marginBottom: 32,
    },
    supportCard: {
        backgroundColor: '#ffffff',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    iconBox: {
        width: 70,
        height: 70,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    blueIconBox: {
        backgroundColor: '#e0e7ff',
    },
    greenIconBox: {
        backgroundColor: '#dcfce7',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    contactButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    contactButtonText: {
        color: '#4f46e5',
        fontWeight: '700',
        fontSize: 14,
    },
    horarioCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignSelf: 'center',
        width: '100%',
    },
    horarioTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    horarioTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    horarioSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
});