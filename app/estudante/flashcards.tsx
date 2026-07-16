import { apiClient } from '@/src/services/api';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // Certifique-se de instalar: expo install @react-native-picker/picker
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Cores idênticas ao seu SCSS
const colors = {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: 'rgba(79, 70, 229, 0.08)',
    textMain: '#111827',
    textLight: '#6b7280',
    white: '#ffffff',
    bgBody: '#f9fafb',
    border: '#e5e7eb',
};

interface Flashcard {
    id: number;
    pergunta: string;
    resposta: string;
    topicId: number;
    topicName: string;
}

export default function FlashcardsEstudante() {
    const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
    const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasFiltered, setHasFiltered] = useState(false);

    // Estado para controlar quais cards estão virados (ID -> boolean)
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 6; // Reduzido para melhor usabilidade em ecrãs mobile

    const [subjects, setSubjects] = useState<{ id: number, name: string }[]>([]);
    const [topics, setTopics] = useState<{ id: number, name: string }[]>([]);

    const [filters, setFilters] = useState({
        subjectId: '',
        topicId: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        try {
            setLoading(true);
            const [resFlashcards, resSubjects] = await Promise.all([
                apiClient.get('/flashcards'),
                apiClient.get('/subjects')
            ]);
            setAllFlashcards(resFlashcards.data || []);
            setSubjects(resSubjects.data || []);
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Erro ao carregar flashcards'
            });
        } finally {
            setLoading(false);
        }
    }

    // Carrega tópicos quando a matéria muda
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
                Toast.show({
                    type: 'error',
                    text1: 'Erro',
                    text2: 'Erro ao carregar tópicos'
                });
            }
        }
        loadTopics();
    }, [filters.subjectId]);

    const handleApplyFilters = () => {
        if (!filters.subjectId && !filters.topicId) {
            setFilteredFlashcards(allFlashcards);
        } else {
            const results = allFlashcards.filter(f => {
                const matchSubj = !filters.subjectId || f.topicId === Number(filters.topicId);
                const matchTopic = !filters.topicId || f.topicId === Number(filters.topicId);
                return matchSubj && matchTopic;
            });
            setFilteredFlashcards(results);
        }
        setHasFiltered(true);
        setFlippedCards({});
        setCurrentPage(1);
    };

    const toggleCard = (id: number) => {
        setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const resetFilters = () => {
        setFilters({ subjectId: '', topicId: '' });
        setFilteredFlashcards([]);
        setHasFiltered(false);
        setFlippedCards({});
        setCurrentPage(1);
    };

    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentCards = filteredFlashcards.slice(indexOfFirstCard, indexOfLastCard);
    const totalPages = Math.ceil(filteredFlashcards.length / cardsPerPage);

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

            {/* Header Interno */}
            <View style={styles.headerTitleContainer}>
                <Text style={styles.mainTitle}>Flashcards de Estudo</Text>
                <Text style={styles.subtitle}>Memorize conceitos-chave de forma rápida.</Text>
            </View>

            {/* Filtros de Seleção */}
            <View style={styles.filterCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Matéria</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={filters.subjectId}
                            onValueChange={itemValue => setFilters({ ...filters, subjectId: itemValue, topicId: '' })}
                            style={styles.picker}
                        >
                            <Picker.Item label="Todas as matérias" value="" />
                            {subjects.map(s => (
                                <Picker.Item key={s.id} label={s.name} value={String(s.id)} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tópico</Text>
                    <View style={[styles.pickerWrapper, !filters.subjectId && styles.disabledPicker]}>
                        <Picker
                            selectedValue={filters.topicId}
                            onValueChange={itemValue => setFilters({ ...filters, topicId: itemValue })}
                            enabled={!!filters.subjectId}
                            style={styles.picker}
                        >
                            <Picker.Item label="Todos os tópicos" value="" />
                            {topics.map(t => (
                                <Picker.Item key={t.id} label={t.name} value={String(t.id)} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.filterActions}>
                    <TouchableOpacity style={styles.btnReset} onPress={resetFilters}>
                        <Feather name="refresh-cw" size={16} color={colors.textLight} />
                        <Text style={styles.btnResetText}>Limpar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnPrimary} onPress={handleApplyFilters}>
                        <Feather name="filter" size={16} color="#fff" />
                        <Text style={styles.btnPrimaryText}>Praticar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Área dos Flashcards */}
            <View style={styles.resultsArea}>
                {!hasFiltered ? (
                    <View style={styles.emptyState}>
                        <Feather name="book-open" size={48} color={colors.textLight} />
                        <Text style={styles.emptyTitle}>Escolha um tema</Text>
                        <Text style={styles.emptySubtitle}>Selecione uma matéria para começar a praticar.</Text>
                    </View>
                ) : loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <View style={styles.flashcardsGrid}>
                        {currentCards.map((f) => {
                            const isFlipped = flippedCards[f.id];
                            return (
                                <TouchableOpacity
                                    key={f.id}
                                    activeOpacity={0.9}
                                    style={styles.flashcardItem}
                                    onPress={() => toggleCard(f.id)}
                                >
                                    {/* Lógica de Virar o Card (Simulação Visual) */}
                                    {!isFlipped ? (
                                        <View style={styles.cardFront}>
                                            <Text style={styles.topicBadge}>{f.topicName}</Text>
                                            <Text style={styles.cardTextFront}>{f.pergunta}</Text>
                                            <View style={styles.cardFooter}>
                                                <Feather name="eye" size={14} color={colors.textLight} />
                                                <Text style={styles.footerText}> Ver resposta</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.cardBack}>
                                            <Text style={[styles.topicBadge, styles.topicBadgeBack]}>Resposta</Text>
                                            <Text style={styles.cardTextBack}>{f.resposta}</Text>
                                            <View style={styles.cardFooter}>
                                                <Text style={[styles.footerText, { color: '#ffffff' }]}>Toque para voltar</Text>
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                    <View style={styles.pagination}>
                        <TouchableOpacity
                            disabled={currentPage === 1}
                            onPress={() => setCurrentPage(prev => prev - 1)}
                            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                        >
                            <Feather name="arrow-left" size={16} color={colors.textMain} />
                        </TouchableOpacity>
                        <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>
                        <TouchableOpacity
                            disabled={currentPage === totalPages}
                            onPress={() => setCurrentPage(prev => prev + 1)}
                            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                        >
                            <Feather name="arrow-right" size={16} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: colors.bgBody,
        flexGrow: 1,
    },
    headerTitleContainer: {
        marginBottom: 24,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textMain,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textLight,
        marginTop: 4,
    },
    filterCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 16,
        marginBottom: 24,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMain,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        backgroundColor: '#fcfcfd',
        overflow: 'hidden',
    },
    disabledPicker: {
        opacity: 0.5,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    btnPrimaryText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
    },
    btnReset: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    btnResetText: {
        color: colors.textLight,
        fontWeight: '700',
        fontSize: 14,
    },
    resultsArea: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMain,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
    },
    loadingState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    flashcardsGrid: {
        gap: 16,
    },
    flashcardItem: {
        height: 220,
        width: '100%',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    cardFront: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBack: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTextFront: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMain,
        textAlign: 'center',
        lineHeight: 22,
    },
    cardTextBack: {
        fontSize: 15,
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 22,
    },
    topicBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        fontSize: 10,
        fontWeight: '800',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: colors.primaryLight,
        color: colors.primary,
        textTransform: 'uppercase',
    },
    topicBadgeBack: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
    },
    cardFooter: {
        position: 'absolute',
        bottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: colors.textLight,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginTop: 32,
        paddingBottom: 40,
    },
    pageButton: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    disabledButton: {
        opacity: 0.4,
    },
    pageIndicator: {
        fontWeight: '700',
        color: colors.textLight,
        fontSize: 14,
    },
});