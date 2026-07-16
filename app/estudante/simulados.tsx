import { apiClient } from '@/src/services/api';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Answer { id: number; text: string; correct: boolean; }
interface SimuladoListData { id: number; name: string; userId: number; }
interface Topic { id: number; name: string; subjectId: number; subjectName: string; }

interface Question {
    id: number;
    statement: string;
    difficulty?: string;
    subjectName?: string;
    topicName?: string;
    vestibular?: string;
    ano?: string | number;
    answers?: Answer[];
    response?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

export default function Simulados() {
    const [userLists, setUserLists] = useState<SimuladoListData[]>([]);
    const [filteredLists, setFilteredLists] = useState<SimuladoListData[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const [selectedList, setSelectedList] = useState<SimuladoListData | null>(null);
    const [questionsInList, setQuestionsInList] = useState<number[]>([]);
    const [listQuestionsDetails, setListQuestionsDetails] = useState<Question[]>([]);
    const [vestibularQuestions, setVestibularQuestions] = useState<Question[]>([]);
    const [dbSubjects, setDbSubjects] = useState<{ id: number; name: string }[]>([]);
    const [dbVestibulares, setDbVestibulares] = useState<string[]>([]);
    const [dbAnos, setDbAnos] = useState<string[]>([]);
    const [dbTopics, setDbTopics] = useState<Topic[]>([]);
    const [aiAvailableTopics, setAiAvailableTopics] = useState<Topic[]>([]);

    const [searchVestText, setSearchVestText] = useState('');
    const initialFilters = { vestibular: '', ano: '', subjectId: '', topic: '', difficulty: '' };
    const [filtersVest, setFiltersVest] = useState(initialFilters);
    const [hasSearched, setHasSearched] = useState(false);
    const [filteredResults, setFilteredResults] = useState<Question[]>([]);

    const [aiConfig, setAiConfig] = useState({
        name: '',
        vestibulares: [] as string[],
        anos: [] as string[],
        subjectId: '' as number | '',
        topics: [] as string[],
        listDifficulty: 'medium',
        quantity: 10,
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [listName, setListName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userName, setUserName] = useState('');

    async function loadData() {
        try {
            setLoading(true);
            const [resLists, resAll, resSubjects, resUser] = await Promise.all([
                apiClient.get('/userLists/simulados'),
                apiClient.get('/questions'),
                apiClient.get('/subjects'),
                apiClient.get('/users/me'),
            ]);
            setUserLists(resLists.data || []);
            setFilteredLists(resLists.data || []);
            setVestibularQuestions(resAll.data || []);
            setDbSubjects(resSubjects.data || []);
            setUserName(resUser.data.name || 'Estudante');

            const allQuestions = resAll.data || [];
            const uniqueVests = Array.from(new Set(allQuestions.map((q: any) => q.vestibular).filter(Boolean))) as string[];
            const uniqueAnos = Array.from(new Set(allQuestions.map((q: any) => q.ano?.toString()).filter(Boolean))) as string[];

            setDbVestibulares(uniqueVests.sort());
            setDbAnos(uniqueAnos.sort((a, b) => b.localeCompare(a)));
        } catch {
            Alert.alert('Erro', 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const filtered = userLists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setFilteredLists(filtered);
    }, [searchQuery, userLists]);

    useEffect(() => {
        async function fetchTopics() {
            if (!filtersVest.subjectId) { setDbTopics([]); return; }
            const res = await apiClient.get(`/topics/subject/${filtersVest.subjectId}`);
            setDbTopics(res.data || []);
        }
        fetchTopics();
    }, [filtersVest.subjectId]);

    useEffect(() => {
        async function fetchAiTopics() {
            if (!aiConfig.subjectId) { setAiAvailableTopics([]); return; }
            const res = await apiClient.get(`/topics/subject/${aiConfig.subjectId}`);
            setAiAvailableTopics(res.data || []);
        }
        fetchAiTopics();
    }, [aiConfig.subjectId]);

    const handleSearchClick = () => {
        const results = vestibularQuestions.filter(q => {
            const term = searchVestText.toLowerCase().trim();
            const currentSubName = dbSubjects.find(s => s.id === Number(filtersVest.subjectId))?.name;
            return (!term || q.statement?.toLowerCase().includes(term) || q.id.toString() === term) &&
                (!filtersVest.vestibular || q.vestibular === filtersVest.vestibular) &&
                (!filtersVest.ano || q.ano?.toString() === filtersVest.ano) &&
                (!filtersVest.subjectId || q.subjectName === currentSubName) &&
                (!filtersVest.topic || q.topicName === filtersVest.topic) &&
                (!filtersVest.difficulty || q.difficulty?.toLowerCase() === filtersVest.difficulty);
        });
        setFilteredResults(results);
        setHasSearched(true);
    };

    async function handleGenerateAi() {
        if (!aiConfig.name || !aiConfig.subjectId) {
            Alert.alert('Aviso', 'Preencha Nome e Matéria.');
            return;
        }
        const selectedSubjectName = dbSubjects.find(s => s.id === aiConfig.subjectId)?.name;
        let pool = vestibularQuestions.filter(q => {
            const matchVest = aiConfig.vestibulares.length === 0 || aiConfig.vestibulares.includes(q.vestibular || '');
            const matchAno = aiConfig.anos.length === 0 || aiConfig.anos.includes(q.ano?.toString() || '');
            const matchSubj = q.subjectName === selectedSubjectName;
            const matchTopic = aiConfig.topics.length === 0 || aiConfig.topics.includes(q.topicName || '');
            return matchVest && matchAno && matchSubj && matchTopic;
        });

        if (pool.length === 0) { Alert.alert('Erro', 'Sem questões para esses filtros.'); return; }
        const shuffle = (arr: Question[]) => [...arr].sort(() => Math.random() - 0.5);
        let selectedIds: number[] = [];
        const qty = aiConfig.quantity;

        const easyPool = shuffle(pool.filter(q => q.difficulty?.toLowerCase() === 'easy'));
        const mediumPool = shuffle(pool.filter(q => q.difficulty?.toLowerCase() === 'medium'));
        const hardPool = shuffle(pool.filter(q => q.difficulty?.toLowerCase() === 'hard'));

        if (aiConfig.listDifficulty === 'easy') {
            selectedIds = [...easyPool.slice(0, Math.floor(qty * 0.7)), ...mediumPool.slice(0, Math.ceil(qty * 0.3))].map(q => q.id);
        } else if (aiConfig.listDifficulty === 'hard') {
            selectedIds = [...mediumPool.slice(0, Math.floor(qty * 0.3)), ...hardPool.slice(0, Math.ceil(qty * 0.7))].map(q => q.id);
        } else {
            selectedIds = [...easyPool.slice(0, Math.floor(qty * 0.2)), ...mediumPool.slice(0, Math.floor(qty * 0.6)), ...hardPool.slice(0, Math.ceil(qty * 0.2))].map(q => q.id);
        }

        if (selectedIds.length < qty) {
            const remaining = pool.filter(q => !selectedIds.includes(q.id));
            const extraIds = shuffle(remaining).slice(0, qty - selectedIds.length).map(q => q.id);
            selectedIds = [...selectedIds, ...extraIds];
        }

        try {
            const resList = await apiClient.post('/userLists/simulado', { name: aiConfig.name });
            const newListId = resList.data.id;
            await Promise.all(selectedIds.map((id, index) =>
                apiClient.post(`/userLists/${newListId}/userListQuestion`, { questionId: id, orderIndex: index + 1 })
            ));
            Alert.alert('Sucesso', 'Simulado gerado!');
            setIsAiModalOpen(false);
            loadData();
        } catch {
            Alert.alert('Erro', 'Erro ao gerar simulado.');
        }
    }

    async function toggleQuestion(questionId: number) {
        if (!selectedList) return;
        const exists = questionsInList.includes(questionId);
        try {
            if (exists) {
                await apiClient.delete(`/userLists/${selectedList.id}/userListQuestion/${questionId}`);
                setQuestionsInList(prev => prev.filter(id => id !== questionId));
                setListQuestionsDetails(prev => prev.filter(q => q.id !== questionId));
            } else {
                await apiClient.post(`/userLists/${selectedList.id}/userListQuestion`, { questionId, orderIndex: questionsInList.length + 1 });
                setQuestionsInList(prev => [...prev, questionId]);
                const details = vestibularQuestions.find(q => q.id === questionId);
                if (details) setListQuestionsDetails(prev => [...prev, details]);
            }
        } catch {
            Alert.alert('Erro', 'Erro na operação.');
        }
    }

    async function openManage(list: SimuladoListData) {
        setSelectedList(list);
        try {
            const res = await apiClient.get(`/userLists/${list.id}/userListQuestion`);
            setQuestionsInList(res.data.map((q: any) => q.questionId));
            setIsQuestionModalOpen(true);
        } catch {
            Alert.alert('Erro', 'Erro ao buscar questões');
        }
    }

    async function openView(list: SimuladoListData) {
        setSelectedList(list);
        try {
            const res = await apiClient.get(`/userLists/${list.id}/userListQuestion`);
            const ids = res.data.map((q: any) => q.questionId);
            setQuestionsInList(ids);
            const details = vestibularQuestions.filter(q => ids.includes(q.id));
            setListQuestionsDetails(details);
            setIsViewModalOpen(true);
        } catch {
            Alert.alert('Erro', 'Erro ao visualizar');
        }
    }

    async function handleSubmit() {
        if (!listName.trim()) {
            Alert.alert('Aviso', 'Informe o nome do simulado.');
            return;
        }
        try {
            if (editingId) await apiClient.put(`/userLists/simulado/${editingId}`, { name: listName });
            else await apiClient.post('/userLists/simulado', { name: listName });
            setIsModalOpen(false);
            loadData();
            Alert.alert('Sucesso', 'Salvo!');
        } catch {
            Alert.alert('Erro', 'Erro ao salvar.');
        }
    }

    function handleDeleteList(id: number) {
        Alert.alert('Excluir', 'Deseja realmente excluir este simulado?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await apiClient.delete(`/userLists/${id}`);
                        loadData();
                    } catch {
                        Alert.alert('Erro', 'Erro ao excluir.');
                    }
                },
            },
        ]);
    }

    // --- Geração de PDF (via expo-print, substitui o jsPDF do site) ---
    async function handleGeneratePDF(list: SimuladoListData, type: 'questions' | 'answers') {
        try {
            const res = await apiClient.get(`/userLists/${list.id}/userListQuestion`);
            const ids = res.data.map((q: any) => q.questionId);
            const questions = vestibularQuestions.filter(q => ids.includes(q.id));

            if (questions.length === 0) {
                Alert.alert('Aviso', 'Este simulado não possui questões.');
                return;
            }

            let html = `
                <html><head><meta charset="utf-8" />
                <style>
                    body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
                    h1 { font-size: 18px; margin-bottom: 20px; }
                    .question { margin-bottom: 18px; }
                    .qTitle { font-weight: bold; margin-bottom: 6px; }
                    .alt { margin-left: 16px; margin-bottom: 3px; font-size: 13px; }
                    .answer { margin-left: 16px; font-size: 13px; }
                </style>
                </head><body>
                <h1>${type === 'questions' ? 'Simulado' : 'Gabarito'}: ${list.name}</h1>
            `;

            questions.forEach((q, index) => {
                if (type === 'answers') {
                    const correctIdx = q.answers?.findIndex(a => a.correct === true);
                    const letter = correctIdx !== undefined && correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : '?';
                    const answerText = q.response || 'Texto da resposta não cadastrado';
                    html += `
                        <div class="question">
                            <div class="qTitle">Questão ${index + 1}:</div>
                            <div class="answer">Alternativa ${letter}) ${answerText}</div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="question">
                            <div class="qTitle">${index + 1}. [${q.vestibular || 'Geral'} - ${q.ano || 'S/A'}]</div>
                            <div>${q.statement}</div>
                    `;
                    q.answers?.forEach((ans, i) => {
                        html += `<div class="alt">${String.fromCharCode(65 + i)}) ${ans.text}</div>`;
                    });
                    html += `</div>`;
                }
            });

            html += `</body></html>`;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${list.name} - ${type === 'questions' ? 'Simulado' : 'Gabarito'}`,
                });
            } else {
                Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Erro', 'Erro ao gerar PDF.');
        }
    }

    function toggleAiCheckbox(field: 'vestibulares' | 'anos' | 'topics', value: string) {
        setAiConfig(prev => {
            const current = prev[field];
            const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [field]: updated };
        });
    }

    if (loading) {
        return (
            <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.flexOne}>
            <ScrollView style={styles.mainContent} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.topHeader}>
                    <View>
                        <Text style={styles.title}>Meus Simulados</Text>
                        <Text style={styles.subtitle}>Crie seus próprios simulados ou use o gerador inteligente.</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.btnAi} onPress={() => setIsAiModalOpen(true)}>
                            <Feather name="zap" size={16} color="#fff" />
                            <Text style={styles.btnAiText}>Gerar com IA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => { setEditingId(null); setListName(''); setIsModalOpen(true); }}
                        >
                            <Feather name="plus" size={16} color="#fff" />
                            <Text style={styles.btnPrimaryText}>Novo Manual</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <Feather name="search" size={16} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar simulado..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {filteredLists.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="clock" size={36} color="#9ca3af" />
                        <Text style={styles.emptyText}>Nenhum simulado encontrado.</Text>
                    </View>
                ) : (
                    filteredLists.map(item => (
                        <View key={item.id} style={styles.listCard}>
                            <View style={styles.listCardHeader}>
                                <Feather name="clock" size={18} color="#4f46e5" />
                                <Text style={styles.listCardName} numberOfLines={1}>{item.name}</Text>
                            </View>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.iconAction} onPress={() => handleGeneratePDF(item, 'questions')}>
                                    <Feather name="download" size={16} color="#ef4444" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconAction} onPress={() => handleGeneratePDF(item, 'answers')}>
                                    <Feather name="file-text" size={16} color="#8b5cf6" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconAction} onPress={() => openView(item)}>
                                    <Feather name="eye" size={16} color="#0ea5e9" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addQuestBtn} onPress={() => openManage(item)}>
                                    <Feather name="plus-circle" size={14} color="#4f46e5" />
                                    <Text style={styles.addQuestBtnText}>Questões</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.iconAction}
                                    onPress={() => { setEditingId(item.id); setListName(item.name); setIsModalOpen(true); }}
                                >
                                    <Feather name="edit-2" size={16} color="#f59e0b" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconAction} onPress={() => handleDeleteList(item.id)}>
                                    <Feather name="trash-2" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* MODAL CRIAR/RENOMEAR */}
            <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Renomear' : 'Novo Simulado'}</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <Feather name="x" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Nome do Simulado</Text>
                        <TextInput style={styles.textInput} value={listName} onChangeText={setListName} />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setIsModalOpen(false)}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={handleSubmit}>
                                <Text style={styles.btnSaveText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL IA */}
            <Modal visible={isAiModalOpen} transparent animationType="slide" onRequestClose={() => setIsAiModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.largeModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>⚡ Gerador de Simulado IA</Text>
                            <TouchableOpacity onPress={() => setIsAiModalOpen(false)}>
                                <Feather name="x" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.label}>Título</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ex: Simulado de Biologia"
                                value={aiConfig.name}
                                onChangeText={(v) => setAiConfig({ ...aiConfig, name: v })}
                            />

                            <Text style={styles.label}>Matéria</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={aiConfig.subjectId}
                                    onValueChange={(v) => setAiConfig({ ...aiConfig, subjectId: v, topics: [] })}
                                >
                                    <Picker.Item label="Selecione..." value="" />
                                    {dbSubjects.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Vestibulares (opcional)</Text>
                            <View style={styles.checkboxGroup}>
                                {dbVestibulares.map(v => (
                                    <TouchableOpacity key={v} style={styles.checkboxItem} onPress={() => toggleAiCheckbox('vestibulares', v)}>
                                        <Feather
                                            name={aiConfig.vestibulares.includes(v) ? 'check-square' : 'square'}
                                            size={18}
                                            color={aiConfig.vestibulares.includes(v) ? '#4f46e5' : '#9ca3af'}
                                        />
                                        <Text style={styles.checkboxLabel}>{v}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Anos (opcional)</Text>
                            <View style={styles.checkboxGroup}>
                                {dbAnos.map(a => (
                                    <TouchableOpacity key={a} style={styles.checkboxItem} onPress={() => toggleAiCheckbox('anos', a)}>
                                        <Feather
                                            name={aiConfig.anos.includes(a) ? 'check-square' : 'square'}
                                            size={18}
                                            color={aiConfig.anos.includes(a) ? '#4f46e5' : '#9ca3af'}
                                        />
                                        <Text style={styles.checkboxLabel}>{a}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Tópicos específicos (opcional)</Text>
                            <View style={styles.checkboxGroup}>
                                {aiAvailableTopics.map(t => (
                                    <TouchableOpacity key={t.id} style={styles.checkboxItem} onPress={() => toggleAiCheckbox('topics', t.name)}>
                                        <Feather
                                            name={aiConfig.topics.includes(t.name) ? 'check-square' : 'square'}
                                            size={18}
                                            color={aiConfig.topics.includes(t.name) ? '#4f46e5' : '#9ca3af'}
                                        />
                                        <Text style={styles.checkboxLabel}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Nível Geral do Simulado</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={aiConfig.listDifficulty}
                                    onValueChange={(v) => setAiConfig({ ...aiConfig, listDifficulty: v })}
                                >
                                    <Picker.Item label="Fácil" value="easy" />
                                    <Picker.Item label="Médio" value="medium" />
                                    <Picker.Item label="Difícil" value="hard" />
                                </Picker>
                            </View>

                            <Text style={styles.label}>Quantidade de Questões</Text>
                            <TextInput
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={String(aiConfig.quantity)}
                                onChangeText={(v) => setAiConfig({ ...aiConfig, quantity: Number(v) || 0 })}
                            />

                            <TouchableOpacity style={styles.btnGenerateNow} onPress={handleGenerateAi}>
                                <Feather name="zap" size={18} color="#fff" />
                                <Text style={styles.btnGenerateNowText}>Gerar Simulado</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL ADICIONAR QUESTÕES */}
            <Modal visible={isQuestionModalOpen} transparent animationType="slide" onRequestClose={() => setIsQuestionModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.largeModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Adicionar Questões</Text>
                            <TouchableOpacity onPress={() => setIsQuestionModalOpen(false)}>
                                <Feather name="x" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <View style={styles.filterArea}>
                                <View style={styles.pickerWrapper}>
                                    <Picker selectedValue={filtersVest.vestibular} onValueChange={(v) => setFiltersVest({ ...filtersVest, vestibular: v })}>
                                        <Picker.Item label="Vestibular" value="" />
                                        {dbVestibulares.map(v => <Picker.Item key={v} label={v} value={v} />)}
                                    </Picker>
                                </View>
                                <View style={styles.pickerWrapper}>
                                    <Picker selectedValue={filtersVest.ano} onValueChange={(v) => setFiltersVest({ ...filtersVest, ano: v })}>
                                        <Picker.Item label="Ano" value="" />
                                        {dbAnos.map(a => <Picker.Item key={a} label={a} value={a} />)}
                                    </Picker>
                                </View>
                                <View style={styles.pickerWrapper}>
                                    <Picker selectedValue={filtersVest.subjectId} onValueChange={(v) => setFiltersVest({ ...filtersVest, subjectId: v, topic: '' })}>
                                        <Picker.Item label="Matéria" value="" />
                                        {dbSubjects.map(s => <Picker.Item key={s.id} label={s.name} value={String(s.id)} />)}
                                    </Picker>
                                </View>
                                <View style={styles.pickerWrapper}>
                                    <Picker selectedValue={filtersVest.topic} onValueChange={(v) => setFiltersVest({ ...filtersVest, topic: v })}>
                                        <Picker.Item label="Tópico" value="" />
                                        {dbTopics.map(t => <Picker.Item key={t.id} label={t.name} value={t.name} />)}
                                    </Picker>
                                </View>
                                <View style={styles.pickerWrapper}>
                                    <Picker selectedValue={filtersVest.difficulty} onValueChange={(v) => setFiltersVest({ ...filtersVest, difficulty: v })}>
                                        <Picker.Item label="Nível" value="" />
                                        <Picker.Item label="Fácil" value="easy" />
                                        <Picker.Item label="Médio" value="medium" />
                                        <Picker.Item label="Difícil" value="hard" />
                                    </Picker>
                                </View>

                                <View style={styles.filterActionsRow}>
                                    <TouchableOpacity style={styles.btnSearchPrimary} onPress={handleSearchClick}>
                                        <Feather name="search" size={16} color="#fff" />
                                        <Text style={styles.btnSearchPrimaryText}>Filtrar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnResetSmall} onPress={() => setFiltersVest(initialFilters)}>
                                        <Feather name="refresh-cw" size={16} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {filteredResults.map(q => {
                                const added = questionsInList.includes(q.id);
                                return (
                                    <View key={q.id} style={[styles.questionSelectItem, added && styles.questionSelected]}>
                                        <View style={styles.qInfo}>
                                            <View style={styles.qHeaderRow}>
                                                <Text style={styles.qId}>#{q.id}</Text>
                                                <Text style={styles.qVest}>{q.vestibular} {q.ano}</Text>
                                                <Text style={styles.qDiff}>{DIFFICULTY_LABEL[q.difficulty?.toLowerCase() || 'medium']}</Text>
                                            </View>
                                            <Text style={styles.qStatement} numberOfLines={3}>{q.statement}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={added ? styles.btnRemoveAction : styles.btnAdd}
                                            onPress={() => toggleQuestion(q.id)}
                                        >
                                            <Feather name={added ? 'check-circle' : 'plus'} size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL VER QUESTÕES */}
            <Modal visible={isViewModalOpen} transparent animationType="slide" onRequestClose={() => setIsViewModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.largeModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedList?.name}</Text>
                            <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                                <Feather name="x" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {listQuestionsDetails.length > 0 ? (
                                listQuestionsDetails.map((q, i) => (
                                    <View key={q.id} style={styles.questionSelectItem}>
                                        <View style={styles.qInfo}>
                                            <Text style={styles.qStatement}>
                                                <Text style={{ fontWeight: '800' }}>{i + 1}. [{q.vestibular} {q.ano}]</Text> {q.statement}
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={styles.btnModernRemove} onPress={() => toggleQuestion(q.id)}>
                                            <Feather name="trash-2" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>Nenhuma questão adicionada a este simulado.</Text>
                            )}
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
const bgBody = '#f8fafc';

const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: bgBody },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bgBody },
    mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

    topHeader: { marginBottom: 18, gap: 12 },
    title: { fontSize: 22, fontWeight: '800', color: textMain },
    subtitle: { color: textLight, marginTop: 4, fontSize: 13 },
    headerActions: { flexDirection: 'row', gap: 10 },
    btnAi: {
        flex: 1, backgroundColor: '#f59e0b', paddingVertical: 12, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    btnAiText: { color: white, fontWeight: '700', fontSize: 13 },
    btnPrimary: {
        flex: 1, backgroundColor: primary, paddingVertical: 12, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    btnPrimaryText: { color: white, fontWeight: '700', fontSize: 13 },

    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: white,
        borderWidth: 1, borderColor: border, borderRadius: 10, paddingHorizontal: 14, marginBottom: 20,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },

    emptyState: { alignItems: 'center', padding: 40, gap: 10 },
    emptyText: { color: textLight, textAlign: 'center' },

    listCard: {
        backgroundColor: white, borderRadius: 14, borderWidth: 1, borderColor: border,
        padding: 16, marginBottom: 14,
    },
    listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    listCardName: { fontWeight: '700', color: textMain, fontSize: 15, flexShrink: 1 },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    iconAction: {
        width: 36, height: 36, borderRadius: 8, backgroundColor: '#f8fafc',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border,
    },
    addQuestBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(79,70,229,0.08)',
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    },
    addQuestBtnText: { color: primary, fontWeight: '700', fontSize: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: white, width: '100%', borderRadius: 16, padding: 24 },
    largeModalContent: { backgroundColor: white, width: '100%', maxHeight: '85%', borderRadius: 16, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 17, fontWeight: '800', color: textMain, flexShrink: 1 },

    label: { fontWeight: '700', color: textMain, fontSize: 13, marginBottom: 6, marginTop: 12 },
    textInput: {
        borderWidth: 1, borderColor: border, borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: white,
    },
    pickerWrapper: { borderWidth: 1, borderColor: border, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },

    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
    btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#f1f5f9' },
    btnCancelText: { color: textLight, fontWeight: '700' },
    btnSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#10b981' },
    btnSaveText: { color: white, fontWeight: '700' },

    checkboxGroup: { borderWidth: 1, borderColor: border, borderRadius: 10, padding: 10, maxHeight: 150, marginBottom: 6 },
    checkboxItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    checkboxLabel: { fontSize: 13, color: textMain },

    btnGenerateNow: {
        backgroundColor: primary, paddingVertical: 16, borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 10,
    },
    btnGenerateNowText: { color: white, fontWeight: '800', fontSize: 15 },

    filterArea: { marginBottom: 16 },
    filterActionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    btnSearchPrimary: {
        flex: 1, backgroundColor: primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 10,
    },
    btnSearchPrimaryText: { color: white, fontWeight: '700' },
    btnResetSmall: {
        width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
        borderWidth: 1, borderColor: border, backgroundColor: white,
    },

    questionSelectItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        borderWidth: 2, borderColor: border, borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: white,
    },
    questionSelected: { borderColor: primary, backgroundColor: 'rgba(79,70,229,0.06)' },
    qInfo: { flex: 1 },
    qHeaderRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
    qId: { fontWeight: '800', color: primary, fontSize: 12 },
    qVest: { fontSize: 11, backgroundColor: '#e2e8f0', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, fontWeight: '700', color: textMain },
    qDiff: { fontSize: 11, fontWeight: '800', color: textLight, textTransform: 'uppercase' },
    qStatement: { fontSize: 13, color: textMain, lineHeight: 19 },

    btnAdd: { backgroundColor: primary, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnRemoveAction: { backgroundColor: '#10b981', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnModernRemove: {
        backgroundColor: '#fee2e2', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
});