import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { RequirePremium } from '@/src/components/RequirePremium';
import { useSubscription } from '@/src/hooks/useSubscription';
import { apiClient } from '@/src/services/api';

interface Answer {
    id: number;
    text: string;
    correct: boolean;
}

interface Question {
    id: number;
    statement: string;
    difficulty: string;
    subjectName: string;
    topicName: string;
    vestibular?: string;
    ano?: string | number;
    answers: Answer[];
    response?: string;
}

export default function RevisarErros() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [userAnswers, setUserAnswers] = useState<Record<number, number | null>>({});

    // Consumindo a assinatura diretamente na tela principal
    const { isActive, planName, loading: loadingSub } = useSubscription();

    const premiumPlans = ["Premium mensal", "Premium anual"];
    const hasPremiumAccess = isActive && premiumPlans.includes(planName);

    // Estados para o Modal de Resposta (Response)
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [activeResponse, setActiveResponse] = useState<string>('');

    // Estados para Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 10;

    useEffect(() => {
        loadWrongQuestions();
    }, []);

    async function loadWrongQuestions() {
        try {
            setLoading(true);
            const response = await apiClient.get('/questions/my-errors');
            setQuestions(response.data || []);
        } catch (error) {
            console.log('Erro ao carregar seu caderno de erros');
        } finally {
            setLoading(false);
        }
    }

    const handleSelectOption = async (questionId: number, answerId: number) => {
        if (userAnswers[questionId]) return;

        try {
            const userRes = await apiClient.get('/users/me');
            const userId = userRes.data.id;

            const payload = {
                userId: userId,
                questionId: questionId,
                answerId: answerId,
            };

            const response = await apiClient.post('/questions/answers', payload);

            if (response.status === 201) {
                setUserAnswers((prev) => ({ ...prev, [questionId]: answerId }));

                const question = questions.find((q) => q.id === questionId);
                const isCorrect = question?.answers.find((a) => a.id === answerId)?.correct;

                if (isCorrect) {
                    console.log("Boa! Você superou esse erro.");
                }
            }
        } catch (error: any) {
            console.log("Erro ao salvar resposta.");
        }
    };

    const handleOpenResponse = (question: Question) => {
        setActiveResponse(question.response || 'Esta questão não possui uma explicação cadastrada.');
        setIsResponseModalOpen(true);
    };

    // Lógica de Paginação
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalPages = Math.ceil(questions.length / questionsPerPage);

    // Mostra o loader até que a assinatura do usuário e as questões estejam prontas
    if (loading || loadingSub) {
        return (
            <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Analisando seu histórico...</Text>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={styles.centerState}>
                <Feather name="check-circle" size={48} color="#10b981" />
                <Text style={styles.emptyTitle}>Tudo limpo!</Text>
                <Text style={styles.emptySubtitle}>Você não possui questões pendentes de revisão no momento.</Text>
            </View>
        );
    }

    return (
        <RequirePremium>

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Alerta de Informações */}
                <View style={styles.infoAlert}>
                    <Feather name="info" size={18} color="#3b82f6" />
                    <Text style={styles.infoAlertText}>
                        Você tem <Text style={{ fontWeight: 'bold' }}>{questions.length}</Text> questões para revisar.
                    </Text>
                </View>

                {/* Grid/Lista de Questões */}
                {currentQuestions.map((q) => (
                    <View key={q.id} style={styles.questionCard}>
                        {/* Header do Card */}
                        <View style={styles.qHeader}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{q.vestibular} {q.ano}</Text>
                            </View>
                            <Text style={[
                                styles.difficulty,
                                q.difficulty?.toLowerCase() === 'easy' && styles.difficultyEasy,
                                q.difficulty?.toLowerCase() === 'medium' && styles.difficultyMedium,
                                q.difficulty?.toLowerCase() === 'hard' && styles.difficultyHard,
                            ]}>
                                {q.difficulty}
                            </Text>
                        </View>

                        {/* Enunciado */}
                        <Text style={styles.statement}>{q.statement}</Text>

                        {/* Alternativas */}
                        <View style={styles.alternativesContainer}>
                            {q.answers?.map((ans, idx) => {
                                const selectedId = userAnswers[q.id];
                                const isSelected = selectedId === ans.id;
                                const hasAnswered = !!selectedId;
                                const isCorrect = ans.correct;

                                const buttonStyle: any[] = [styles.altBtn];
                                const textStyle: any[] = [styles.altBtnText];
                                const indicatorStyle: any[] = [styles.indexIndicator];
                                const indicatorTextStyle: any[] = [styles.indexIndicatorText];

                                if (hasAnswered) {
                                    if (isSelected && isCorrect) {
                                        buttonStyle.push(styles.correctSelected);
                                        textStyle.push(styles.textWhite);
                                        indicatorStyle.push(styles.indicatorTransparent);
                                        indicatorTextStyle.push(styles.textWhite);
                                    } else if (isSelected && !isCorrect) {
                                        buttonStyle.push(styles.wrongSelected);
                                        textStyle.push(styles.textWhite);
                                        indicatorStyle.push(styles.indicatorTransparent);
                                        indicatorTextStyle.push(styles.textWhite);
                                    } else if (!isSelected && isCorrect) {
                                        buttonStyle.push(styles.correctNotSelected);
                                        textStyle.push(styles.textCorrectDark);
                                        indicatorStyle.push(styles.indicatorSuccess);
                                        indicatorTextStyle.push(styles.textWhite);
                                    }
                                }

                                return (
                                    <TouchableOpacity
                                        key={ans.id}
                                        style={buttonStyle}
                                        onPress={() => handleSelectOption(q.id, ans.id)}
                                        disabled={hasAnswered}
                                        activeOpacity={0.7}
                                    >
                                        <View style={indicatorStyle}>
                                            <Text style={indicatorTextStyle}>{String.fromCharCode(65 + idx)}</Text>
                                        </View>
                                        <Text style={[textStyle, { flex: 1 }]}>{ans.text}</Text>

                                        {hasAnswered && isCorrect && isSelected && (
                                            <Feather name="check-circle" size={18} color="#fff" />
                                        )}
                                        {hasAnswered && isSelected && !isCorrect && (
                                            <Feather name="x-circle" size={18} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Footer do Card */}
                        <View style={styles.qFooter}>
                            <Text style={styles.topicName}>{q.subjectName} • {q.topicName}</Text>

                            {/* Renderização Condicional da Resolução */}
                            {userAnswers[q.id] && (
                                hasPremiumAccess ? (
                                    <TouchableOpacity
                                        style={styles.btnShowResponse}
                                        onPress={() => handleOpenResponse(q)}
                                    >
                                        <Feather name="info" size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.btnShowResponseText}>Ver Resolução</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.btnAiDisabled}>
                                        <Text style={styles.btnAiDisabledText}>🔒 Ver Resolução (Premium)</Text>
                                    </View>
                                )
                            )}
                        </View>
                    </View>
                ))}

                {/* Paginação */}
                {totalPages > 1 && (
                    <View style={styles.pagination}>
                        <TouchableOpacity
                            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                            disabled={currentPage === 1}
                            onPress={() => setCurrentPage((prev) => prev - 1)}
                        >
                            <Feather name="arrow-left" size={16} color={currentPage === 1 ? '#9ca3af' : '#111827'} />
                            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Anterior</Text>
                        </TouchableOpacity>

                        <Text style={styles.pageInfo}>Página {currentPage} de {totalPages}</Text>

                        <TouchableOpacity
                            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                            disabled={currentPage === totalPages}
                            onPress={() => setCurrentPage((prev) => prev + 1)}
                        >
                            <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Próxima</Text>
                            <Feather name="arrow-right" size={16} color={currentPage === totalPages ? '#9ca3af' : '#111827'} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Modal de Explicação/Resolução */}
                <Modal
                    visible={isResponseModalOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsResponseModalOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.responseModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Resolução Comentada</Text>
                                <TouchableOpacity
                                    onPress={() => setIsResponseModalOpen(false)}
                                    style={styles.closeBtn}
                                >
                                    <Feather name="x" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.responseTextCard}>
                                    <Text style={styles.responseText}>{activeResponse}</Text>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </RequirePremium>
    );
}

// Estilos mantidos para layout responsivo do dispositivo
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 32,
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    infoAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    infoAlertText: {
        color: '#1e40af',
        fontSize: 14,
        marginLeft: 8,
    },
    questionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 20,
        marginBottom: 20,
    },
    qHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#4f46e5',
        fontSize: 12,
        fontWeight: '800',
    },
    difficulty: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    difficultyEasy: {
        color: '#10b981',
    },
    difficultyMedium: {
        color: '#f59e0b',
    },
    difficultyHard: {
        color: '#ef4444',
    },
    statement: {
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
        marginBottom: 20,
        textAlign: 'left',
    },
    alternativesContainer: {
        gap: 10,
        marginBottom: 20,
    },
    altBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    altBtnText: {
        fontSize: 14,
        color: '#111827',
        marginLeft: 12,
    },
    indexIndicator: {
        width: 28,
        height: 28,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexIndicatorText: {
        fontWeight: '800',
        fontSize: 13,
        color: '#111827',
    },
    correctSelected: {
        backgroundColor: '#065f46',
        borderColor: '#065f46',
    },
    wrongSelected: {
        backgroundColor: '#b91c1c',
        borderColor: '#b91c1c',
    },
    correctNotSelected: {
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
    },
    indicatorTransparent: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    indicatorSuccess: {
        backgroundColor: '#10b981',
    },
    textWhite: {
        color: '#ffffff',
    },
    textCorrectDark: {
        color: '#065f46',
    },
    qFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-start',
    },
    topicName: {
        fontSize: 13,
        color: '#6b7280',
    },
    btnShowResponse: {
        backgroundColor: '#4f46e5',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    btnShowResponseText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnAiDisabled: {
        backgroundColor: '#e5e7eb',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
    },
    btnAiDisabledText: {
        color: '#9ca3af',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 10,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    pageBtnDisabled: {
        opacity: 0.5,
    },
    pageBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    pageBtnTextDisabled: {
        color: '#9ca3af',
    },
    pageInfo: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    responseModalContent: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxHeight: '80%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        padding: 20,
        backgroundColor: '#fcfcfd',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        padding: 20,
    },
    responseTextCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4f46e5',
        marginBottom: 20,
    },
    responseText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#374151',
    },
});