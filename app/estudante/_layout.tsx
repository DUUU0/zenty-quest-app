import { Feather } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import userService from '../../src/services/UserService';

// Cabeçalho Customizado com Menu Deslizável (Adaptação da Sidebar para Mobile)
function CustomHeader() {
    const router = useRouter();
    const pathname = usePathname();

    async function handleLogout() {
        try {
            await userService.logOut("/login");
            router.replace('/login');
        } catch (error) {
            console.error("Erro ao sair", error);
        }
    }

    // Itens exatos da imagem fornecida
    const navItems = [
        { label: 'Dashboard', path: '/estudante/dashboardEstudante', icon: 'bar-chart-2' },
        { label: 'Flashcards', path: '/estudante/flashcards', icon: 'folder' },
        { label: 'Banco de questões', path: '/estudante/questoes', icon: 'help-circle' },
        { label: 'Simulados', path: '/estudante/simulados', icon: 'clock' },
        { label: 'Caderno de erros', path: '/estudante/revisarErros', icon: 'edit' },
        { label: 'Suporte', path: '/estudante/suporte', icon: 'headphones' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>

                {/* Linha 1: Logótipo e Botão de Sair (Footer da imagem adaptado) */}
                <View style={styles.topRow}>
                    <Text style={styles.logo}>
                        Zenty<Text style={styles.logoHighlight}>Quest</Text>
                    </Text>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Feather name="log-out" size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Sair</Text>
                    </TouchableOpacity>
                </View>

                {/* Linha 2: Links de Navegação (Sidebar da imagem adaptada para scroll horizontal) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.navMenu}
                >
                    {navItems.map((item, index) => {
                        // Verifica se a aba atual é a ativa
                        const isActive = pathname === item.path || pathname.includes(item.path);

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.navItem, isActive && styles.navItemActive]}
                                onPress={() => router.push(item.path as any)}
                            >
                                <Feather
                                    name={item.icon as any}
                                    size={16}
                                    // Cores baseadas no logótipo (roxo) para o item ativo, cinzento para inativos
                                    color={isActive ? '#4f46e5' : '#6b7280'}
                                />
                                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

export default function EstudanteLayout() {
    return (
        <Stack
            screenOptions={{
                // Substitui o cabeçalho padrão do Expo pelo nosso Customizado
                header: () => <CustomHeader />
            }}
        >
            <Stack.Screen name="dashboardEstudante" />
            <Stack.Screen name="planos" />
            {/* À medida que for criando os outros ficheiros (flashcards.tsx, simulados.tsx, etc.) 
                na pasta 'estudante', não precisa de os adicionar manualmente aqui se não quiser configurações 
                específicas. O Expo Router deteta-os e aplica este cabeçalho automaticamente! */}
        </Stack>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#ffffff',
        paddingTop: Platform.OS === 'android' ? 30 : 0, // Compensa a barra de estado no Android
    },
    headerContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    logo: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    logoHighlight: {
        color: '#4f46e5',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    logoutText: {
        color: '#6b7280', // Cor subtil para o botão de sair, combinando com a imagem
        fontWeight: '500',
        fontSize: 14,
    },
    navMenu: {
        paddingHorizontal: 15,
        paddingBottom: 12,
        gap: 12, // Espaçamento maior entre os itens para toque no ecrã
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    navItemActive: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)', // Fundo roxo clarinho quando ativo (igual à imagem)
    },
    navText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 14,
    },
    navTextActive: {
        color: '#4f46e5',
    },
});