import { apiClient } from '@/src/services/api';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
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

interface Subject { id: number; name: string; }
interface Topic { id: number; name: string; }

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const DIFFICULTY_LABEL: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Média',
    hard: 'Difícil',
};

const DIFFICULTY_COLOR: Record<string, string> = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
};

const QUESTIONS_PER_PAGE = 10;

export default function QuestoesEstudante() {
    const router = useRouter();

    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasFiltered, setHasFiltered] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, number | null>>({});

    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [activeResponse, setActiveResponse] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [dbVestibulares, setDbVestibulares] = useState<string[]>([]);
    const [dbAnos, setDbAnos] = useState<string[]>([]);

    const [filters, setFilters] = useState({
        subjectId: '',
        topicName: '',
        difficulty: '',
        vestibular: '',
        ano: '',
    });

    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        try {
            setLoading(true);
            const [resQuestions, resSubjects] = await Promise.all([
                apiClient.get('/questions'),
                apiClient.get('/subjects'),
            ]);

            const allData: Question[] = resQuestions.data || [];
            setAllQuestions(allData);
            setSubjects(resSubjects.data || []);

            const uniqueVests = Array.from(new Set(allData.map(q => q.vestibular).filter(Boolean))) as string[];
            const uniqueAnos = Array.from(new Set(allData.map(q => q.ano?.toString()).filter(Boolean))) as string[];

            setDbVestibulares(uniqueVests.sort());
            setDbAnos(uniqueAnos.sort((a, b) => b.localeCompare(a)));
        } catch (err) {
            setWarning('Erro ao carregar dados iniciais');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        async function loadTopics() {
            if (!filters.subjectId) {
                setTopics([]);
                return;
            }
            try {
                const res = await apiClient.get(`/topics/subject/${filters.subjectId}`);
                setTopics(res.data || []);
            } catch {
                setWarning('Erro ao carregar tópicos');
            }
        }
        loadTopics();
    }, [filters.subjectId]);

    function handleApplyFilters() {
        if (!filters.subjectId && !filters.vestibular && !filters.ano && !filters.difficulty) {
            setWarning('Selecione pelo menos um critério de filtro.');
            return;
        }
        setWarning(null);

        const currentSubjectName = subjects.find(s => s.id === Number(filters.subjectId))?.name;

        const results = allQuestions.filter(q => {
            const matchSubj = !filters.subjectId || q.subjectName === currentSubjectName;
            const matchTopic = !filters.topicName || q.topicName === filters.topicName;
            const matchVest = !filters.vestibular || q.vestibular === filters.vestibular;
            const matchAno = !filters.ano || q.ano?.toString() === filters.ano;
            const matchDiff = !filters.difficulty || q.difficulty?.toLowerCase() === filters.difficulty.toLowerCase();
            return matchSubj && matchTopic && matchVest && matchAno && matchDiff;
        });

        setFilteredQuestions(shuffleArray(results));
        setHasFiltered(true);
        setUserAnswers({});
        setCurrentPage(1);
    }

    function resetFilters() {
        setFilters({ subjectId: '', topicName: '', difficulty: '', vestibular: '', ano: '' });
        setFilteredQuestions([]);
        setHasFiltered(false);
        setUserAnswers({});
        setCurrentPage(1);
        setWarning(null);
    }

    async function handleSelectOption(questionId: number, answerId: number) {
        if (userAnswers[questionId]) return;

        try {
            const userRes = await apiClient.get('/users/me');
            const userId = userRes.data.id;

            const response = await apiClient.post('/questions/answers', {
                userId,
                questionId,
                answerId,
            });

            if (response.status === 201) {
                setUserAnswers(prev => ({ ...prev, [questionId]: answerId }));
            }
        } catch {
            setWarning('Erro ao processar resposta.');
        }
    }

    function handleOpenResponse(question: Question) {
        setActiveResponse(question.response || 'Esta questão não possui uma explicação cadastrada.');
        setIsResponseModalOpen(true);
    }

    const indexOfLastQuestion = currentPage * QUESTIONS_PER_PAGE;
    const indexOfFirstQuestion = indexOfLastQuestion - QUESTIONS_PER_PAGE;
    const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);

    if (loading) {
        return (
            <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Buscando questões...</Text>
            </View>
        );
    }

    return (
        <View style={styles.flexOne}>
            <ScrollView style={styles.mainContent} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.topHeader}>
                    <Text style={styles.title}>Banco de Questões</Text>
                    <Text style={styles.subtitle}>Filtre o conteúdo para praticar seus conhecimentos.</Text>
                </View>

                {/* --- FILTROS --- */}
                <View style={styles.filterCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Matéria</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={filters.subjectId}
                                onValueChange={(v) => setFilters({ ...filters, subjectId: v, topicName: '' })}
                            >
                                <Picker.Item label="Todas" value="" />
                                {subjects.map(s => (
                                    <Picker.Item key={s.id} label={s.name} value={String(s.id)} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tópico</Text>
                        <View style={[styles.pickerWrapper, !filters.subjectId && styles.pickerDisabled]}>
                            <Picker
                                enabled={!!filters.subjectId}
                                selectedValue={filters.topicName}
                                onValueChange={(v) => setFilters({ ...filters, topicName: v })}
                            >
                                <Picker.Item label="Todos os tópicos" value="" />
                                {topics.map(t => (
                                    <Picker.Item key={t.id} label={t.name} value={t.name} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vestibular</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={filters.vestibular}
                                onValueChange={(v) => setFilters({ ...filters, vestibular: v })}
                            >
                                <Picker.Item label="Todos" value="" />
                                {dbVestibulares.map(v => (
                                    <Picker.Item key={v} label={v} value={v} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ano</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={filters.ano}
                                onValueChange={(v) => setFilters({ ...filters, ano: v })}
                            >
                                <Picker.Item label="Todos" value="" />
                                {dbAnos.map(a => (
                                    <Picker.Item key={a} label={a} value={a} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Dificuldade</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={filters.difficulty}
                                onValueChange={(v) => setFilters({ ...filters, difficulty: v })}
                            >
                                <Picker.Item label="Todas" value="" />
                                <Picker.Item label="Fácil" value="easy" />
                                <Picker.Item label="Média" value="medium" />
                                <Picker.Item label="Difícil" value="hard" />
                            </Picker>
                        </View>
                    </View>

                    {warning && <Text style={styles.warningText}>{warning}</Text>}

                    <View style={styles.filterActions}>
                        <TouchableOpacity style={styles.btnReset} onPress={resetFilters}>
                            <Feather name="rotate-ccw" size={16} color="#6b7280" />
                            <Text style={styles.btnResetText}>Limpar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleApplyFilters}>
                            <Feather name="filter" size={16} color="#fff" />
                            <Text style={styles.btnPrimaryText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- RESULTADOS --- */}
                {!hasFiltered ? (
                    <View style={styles.emptyState}>
                        <Feather name="search" size={44} color="#9ca3af" />
                        <Text style={styles.emptyTitle}>Pronto para começar?</Text>
                        <Text style={styles.emptyText}>Utilize os filtros acima para carregar questões do nosso banco.</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.countInfo}>
                            Foram encontradas <Text style={{ fontWeight: '700' }}>{filteredQuestions.length}</Text> questões.
                        </Text>

                        {currentQuestions.map((q) => {
                            const selectedId = userAnswers[q.id];
                            const hasAnswered = !!selectedId;

                            return (
                                <View key={q.id} style={styles.questionCard}>
                                    <View style={styles.qHeader}>
                                        <Text style={styles.badge}>{q.vestibular || 'Geral'} {q.ano}</Text>
                                        <Text style={[styles.difficulty, { color: DIFFICULTY_COLOR[q.difficulty?.toLowerCase()] || '#f59e0b' }]}>
                                            {DIFFICULTY_LABEL[q.difficulty?.toLowerCase()] || 'Média'}
                                        </Text>
                                    </View>

                                    <Text style={styles.statement}>{q.statement}</Text>

                                    <View style={styles.alternatives}>
                                        {q.answers?.map((ans, idx) => {
                                            const isSelected = selectedId === ans.id;
                                            const isCorrect = ans.correct;

                                            let cardStyle: any[] = [styles.altBtn];
                                            let textStyle: any[] = [styles.altText];
                                            let letterStyle: any[] = [styles.altLetter];
                                            let letterTextStyle: any[] = [styles.altLetterText];

                                            if (hasAnswered) {
                                                if (isSelected && isCorrect) {
                                                    cardStyle.push(styles.correctSelected);
                                                    textStyle.push(styles.whiteText);
                                                    letterStyle.push(styles.letterOverlay);
                                                    letterTextStyle.push(styles.whiteText);
                                                } else if (isSelected && !isCorrect) {
                                                    cardStyle.push(styles.wrongSelected);
                                                    textStyle.push(styles.whiteText);
                                                    letterStyle.push(styles.letterOverlay);
                                                    letterTextStyle.push(styles.whiteText);
                                                } else if (!isSelected && isCorrect) {
                                                    cardStyle.push(styles.correctNotSelected);
                                                    letterStyle.push(styles.letterGreen);
                                                    letterTextStyle.push(styles.whiteText);
                                                }
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={ans.id}
                                                    style={cardStyle}
                                                    onPress={() => handleSelectOption(q.id, ans.id)}
                                                    disabled={hasAnswered}
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={letterStyle}>
                                                        <Text style={letterTextStyle}>{String.fromCharCode(65 + idx)}</Text>
                                                    </View>
                                                    <Text style={textStyle}>{ans.text}</Text>
                                                    {hasAnswered && isCorrect && isSelected && (
                                                        <Feather name="check-circle" size={18} color="#fff" style={styles.iconStatus} />
                                                    )}
                                                    {hasAnswered && isSelected && !isCorrect && (
                                                        <Feather name="x-circle" size={18} color="#fff" style={styles.iconStatus} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <View style={styles.qFooter}>
                                        <Text style={styles.topicName}>{q.subjectName} • {q.topicName}</Text>

                                        {hasAnswered && (
                                            <TouchableOpacity
                                                style={styles.btnShowResponse}
                                                onPress={() => handleOpenResponse(q)}
                                            >
                                                <Feather name="info" size={16} color="#fff" />
                                                <Text style={styles.btnShowResponseText}>Ver Resolução</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}

                        {totalPages > 1 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                    disabled={currentPage === 1}
                                    onPress={() => setCurrentPage(p => p - 1)}
                                >
                                    <Feather name="arrow-left" size={16} color="#111827" />
                                    <Text style={styles.pageBtnText}>Anterior</Text>
                                </TouchableOpacity>

                                <Text style={styles.pageIndicator}>Página {currentPage} de {totalPages}</Text>

                                <TouchableOpacity
                                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                                    disabled={currentPage === totalPages}
                                    onPress={() => setCurrentPage(p => p + 1)}
                                >
                                    <Text style={styles.pageBtnText}>Próxima</Text>
                                    <Feather name="arrow-right" size={16} color="#111827" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* --- MODAL DE RESOLUÇÃO --- */}
            <Modal
                visible={isResponseModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsResponseModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.responseModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Resolução Comentada</Text>
                            <TouchableOpacity onPress={() => setIsResponseModalOpen(false)}>
                                <Feather name="x" size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.responseText}>{activeResponse}</Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const primary = '#4f46e5';
const textMain = '#111827';
const textLight = '#6b7280';
const white = '#ffffff';
const border = '#e5e7eb';
const bgBody = '#f9fafb';

const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: bgBody },
    mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bgBody, gap: 10 },
    loadingText: { color: textLight, marginTop: 8 },

    topHeader: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: textMain },
    subtitle: { color: textLight, marginTop: 4, fontSize: 14 },

    filterCard: {
        backgroundColor: white,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        marginBottom: 24,
        gap: 12,
    },
    inputGroup: { gap: 6 },
    label: { fontSize: 13, fontWeight: '700', color: textMain },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: border,
        borderRadius: 10,
        backgroundColor: white,
        overflow: 'hidden',
    },
    pickerDisabled: { backgroundColor: '#f3f4f6' },
    warningText: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
        marginTop: 4,
    },
    btnPrimary: {
        backgroundColor: primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    btnPrimaryText: { color: white, fontWeight: '700', fontSize: 13 },
    btnReset: {
        backgroundColor: white,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    btnResetText: { color: textLight, fontWeight: '700', fontSize: 13 },

    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: white,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: border,
        borderStyle: 'dashed',
        gap: 8,
    },
    emptyTitle: { fontWeight: '700', fontSize: 16, color: textMain, marginTop: 8 },
    emptyText: { color: textLight, textAlign: 'center', fontSize: 13 },

    countInfo: { marginBottom: 16, color: textLight, fontSize: 13 },

    questionCard: {
        backgroundColor: white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        padding: 18,
        marginBottom: 20,
    },
    qHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    badge: {
        backgroundColor: 'rgba(79,70,229,0.08)',
        color: primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: '800',
        overflow: 'hidden',
    },
    difficulty: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    statement: { fontSize: 15, lineHeight: 22, color: textMain, marginBottom: 18 },

    alternatives: { gap: 10, marginBottom: 18 },
    altBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: white,
    },
    altLetter: {
        width: 26,
        height: 26,
        borderRadius: 6,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    altLetterText: { fontWeight: '800', fontSize: 12, color: textMain },
    altText: { flex: 1, color: textMain, fontSize: 14 },
    whiteText: { color: white },
    letterOverlay: { backgroundColor: 'rgba(255,255,255,0.2)' },
    letterGreen: { backgroundColor: '#10b981' },
    iconStatus: { marginLeft: 'auto' },

    correctSelected: { backgroundColor: '#065f46', borderColor: '#065f46' },
    wrongSelected: { backgroundColor: '#b91c1c', borderColor: '#b91c1c' },
    correctNotSelected: { backgroundColor: '#d1fae5', borderColor: '#10b981' },

    qFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
        flexWrap: 'wrap',
        gap: 10,
    },
    topicName: { fontSize: 13, color: textLight },
    btnShowResponse: {
        backgroundColor: primary,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    btnShowResponseText: { color: white, fontWeight: '700', fontSize: 13 },

    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: white,
    },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { fontWeight: '600', color: textMain, fontSize: 13 },
    pageIndicator: { color: textLight, fontWeight: '600', fontSize: 13 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    responseModalContent: {
        backgroundColor: white,
        width: '100%',
        maxHeight: '70%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: textMain },
    modalBody: { padding: 20 },
    responseText: { fontSize: 15, lineHeight: 24, color: '#374151' },
});