import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, radius } from '../src/constants/theme';
import UserService from '../src/services/UserService';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Toast.show({ type: 'info', text1: 'Preencha todos os campos!' });
            return;
        }

        setLoading(true);
        try {
            const response = await UserService.login({ email, password });

            if (response) {
                Toast.show({ type: 'success', text1: 'Logado com sucesso!' });

                const isStudent = await UserService.isStudent();
                const isTeacher = await UserService.isTeacher();
                const isAdmin = await UserService.isAdmin();

                router.replace('/estudante/dashboardEstudante');
                // else if (isTeacher) router.replace('/(teacher)/dashboard');
                // else if (isAdmin) router.replace('/(student)/dashboard'); // ajuste conforme sua rota admin
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Email e/ou senha errados!' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.bodyWrapper}>
                <View style={styles.backContainer}>
                    <Link href="/" asChild>
                        <TouchableOpacity style={styles.btnOutline}>
                            <Feather name="arrow-left" size={16} color={colors.textMain} />
                            <Text style={styles.btnOutlineText}>Voltar</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <View style={styles.loginWrapper}>
                    <View style={styles.loginHeader}>
                        <Text style={styles.logo}>
                            Zenty<Text style={{ color: colors.primary }}>Quest</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Bem-vindo de volta! Insira seus dados para entrar.
                        </Text>
                    </View>

                    <View style={styles.loginCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="exemplo@email.com"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Senha</Text>
                                <Link href="/" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.forgotPass}>Ajuda?</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.btnPrimaryText}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.registerText}>
                        Ainda não tem conta?{' '}
                        <Link href="/" asChild>
                            <Text style={styles.registerLink}>Criar conta grátis</Text>
                        </Link>
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    bodyWrapper: {
        flexGrow: 1,
        backgroundColor: colors.bgBody,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    backContainer: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 20,
    },
    btnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radius.sm,
        backgroundColor: colors.white,
    },
    btnOutlineText: {
        color: colors.textMain,
        fontWeight: '600',
        fontSize: 13,
    },
    loginWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    loginHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textMain,
        marginBottom: 8,
    },
    subtitle: {
        color: colors.textLight,
        fontSize: 15,
        marginBottom: 24,
        textAlign: 'center',
    },
    loginCard: {
        width: '100%',
        backgroundColor: colors.white,
        padding: 24,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        color: colors.textMain,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotPass: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: colors.textMain,
        backgroundColor: colors.white,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    btnPrimaryText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    registerText: {
        marginTop: 25,
        fontSize: 14,
        color: colors.textLight,
    },
    registerLink: {
        color: colors.primary,
        fontWeight: '700',
    },
});