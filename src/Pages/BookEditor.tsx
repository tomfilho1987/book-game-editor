/**
 * @file BookEditor.tsx
 * @description Componente responsável por editar os capítulos do livro-jogo.
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 1.0
 */
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Checkbox, Divider, IconButton, FormControlLabel, List, ListItem, ListItemButton, ListItemText, Tab, Tabs, TextField, Typography,
    Autocomplete, createFilterOptions, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    Grid2, Grid} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Chapter } from "../Types/Chapter";
import { Choice } from "../Types/Choice";
import { IChapterOption } from "../Interfaces/IChapterOption";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IChoiceJSON } from "../Interfaces/JSON/IChoiceJSON";
import { IChapterDataJSON } from "../Interfaces/JSON/IChapterDataJSON";
import { v4 as uuidv4 } from 'uuid';
import { ICustomDialogAlert } from "../Interfaces/ICustomDialogAlert";
import CustomAlertDialog from "../Components/CustomAlertDialog";
import { saveJsonFile } from "../Utils/saveGameData";

const initialData: Chapter[] = JSON.parse(localStorage.getItem("bookData") || "[]") || [
  {
    id: 1,
    title: "Capítulo 1",
    text: "Você está em uma floresta sombria...",
    choices: [
      { target: 2, text: "Seguir a trilha" },
      { target: 3, text: "Entrar na caverna" },
    ],
  },
];

/**
 * @function BookEditor
 * @description Componente principal para editar os capítulos do livro-jogo.
 * @returns {JSX.Element} Elemento JSX contendo o editor de capítulos.
 */
const BookEditor: React.FC = () => {
  /** Estado para armazenar a lista de capítulos. */
  const [chapters, setChapters] = useState<Chapter[]>(initialData);
  /** Estado para armazenar o capítulo selecionado para edição. */
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(
    chapters.length > 0 ? chapters[0] : null
  );
  /** Estado para armazenar o nome do arquivo JSON carregado. */
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  /** Estado para controlar a abertura do diálogo de salvar. */
  const [openDialog, setOpenDialog] = useState(false);
  const chapterListRef = useRef<HTMLDivElement>(null);
  const [dialogAlert, setDialogAlert] = React.useState<ICustomDialogAlert>({ open: false, title: 'Confirma Operação?', message: '', param: '' })
  const [onStartHiddenStatus, setOnStartHiddenStatus] = useState<Record<number, Record<string, boolean>>>({});
  const [firstDestinationAdded, setFirstDestinationAdded] = useState(false);
  const [probabilityErrors, setProbabilityErrors] = useState<Record<number, string | null>>({});

  const [sumOfProbabilities, setSumOfProbabilities] = useState<number>(0);
  const [probabilityValidationMessage, setProbabilityValidationMessage] = useState<string | null>(null);
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState<number>(0); // Índice da escolha sendo editada
  const currentChapterIndex = chapters.findIndex(ch => ch.id === selectedChapter?.id);
  const currentChapter = currentChapterIndex !== -1 ? chapters[currentChapterIndex] : null;
  const currentChoice = currentChapter?.choices[currentChoiceIndex];
  const [focusedProbabilityField, setFocusedProbabilityField] = useState<number | null>(null);
  const [lastModifiedFieldBelow100, setLastModifiedFieldBelow100] = useState<number | null>(null);
  /** Estado para controlar a aba principal selecionada (0: Gatilhos, 1: Escolhas). */
  const [selectedTab, setSelectedTab] = useState(0); // Inicialmente, Escolhas estará selecionada

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedTab(0); // Define a aba principal para "ESCOLHAS" ao selecionar um capítulo
  };

  const updateOnStartKey = (oldKey: string, newKey: string, value: number | string) => {
    if (!selectedChapter || !selectedChapter.on_start) return;
    const updatedOnStart = { ...selectedChapter.on_start };
    delete updatedOnStart[oldKey];
    updatedOnStart[newKey] = value;
    handleChapterChange("on_start", updatedOnStart);
  
    // Atualiza o estado de oculto também se a chave mudar
    setOnStartHiddenStatus(prevStatus => {
      const chapterStatus = prevStatus[selectedChapter.id];
      if (chapterStatus && chapterStatus[oldKey] !== undefined) {
        const newChapterStatus = { ...chapterStatus };
        newChapterStatus[newKey] = newChapterStatus[oldKey];
        delete newChapterStatus[oldKey];
        return { ...prevStatus, [selectedChapter.id]: newChapterStatus };
      }
      return prevStatus;
    });
  };

  const updateOnStartValue = (key: string, newValue: number | string) => {
    if (!selectedChapter || !selectedChapter.on_start) return;
    const updatedOnStart = { ...selectedChapter.on_start, [key]: newValue };
    handleChapterChange("on_start", updatedOnStart);
  };

  /**
   * @function isOnStartHidden
   * @description Verifica se um item específico do "On Start" está marcado como oculto.
   * @param {string} key - A chave do item "On Start".
   * @returns {boolean} - True se o item estiver marcado como oculto, false caso contrário.
   */
  const isOnStartHidden = (key: string): boolean => {
  return onStartHiddenStatus[selectedChapter?.id || -1]?.[key] || false;
  };

  /**
 * @function handleOnStartHiddenChange
 * @description Atualiza o estado de "oculto" de um item do "On Start".
 * @param {string} key - A chave do item "On Start".
 * @param {boolean} checked - O novo estado do checkbox (true para oculto, false para não oculto).
 */
  const handleOnStartHiddenChange = (key: string, checked: boolean) => {
    if (!selectedChapter) return;
    setOnStartHiddenStatus(prevStatus => ({
      ...prevStatus,
      [selectedChapter.id]: {
        ...prevStatus[selectedChapter.id],
        [key]: checked,
      },
    }));
  };

  /**
   * @effect Atualiza o localStorage com os dados dos capítulos sempre que a lista de capítulos é alterada.
   */
  useEffect(() => {
    localStorage.setItem("bookData", JSON.stringify(chapters));
  }, [chapters]);

  /**
   * @effect Rola para o final da lista de capítulos quando um novo capítulo é adicionado.
   */
  useEffect(() => {
    if (chapterListRef.current) {
        chapterListRef.current.scrollTop = chapterListRef.current.scrollHeight;
    }
  }, [chapters.length]); // Rola apenas quando o *comprimento* da lista de capítulos muda (adição ou remoção)

  useEffect(() => {
    if (currentChoice?.targets) {
      const initialSum = currentChoice.targets.reduce((sum, target) => sum + Number(target.probability), 0);
      setSumOfProbabilities(initialSum);
      setProbabilityValidationMessage(initialSum === 100 || currentChoice.targets.length === 0 ? null : `A soma das probabilidades é ${initialSum}%, faltam ${100 - initialSum}%.`);
    } else {
      setSumOfProbabilities(0);
      setProbabilityValidationMessage(null);
    }
  }, [currentChapterIndex, currentChoice?.targets]);

  /**
   * @function handleChapterChange
   * @description Atualiza o campo especificado do capítulo selecionado.
   * @param {keyof Chapter} field - O campo do capítulo a ser atualizado.
   * @param {any} value - O novo valor para o campo.
   */
  const handleChapterChange = (field: keyof Chapter, value: any) => {
    if (!selectedChapter) return;
    const updatedChapter = { ...selectedChapter, [field]: value };
    setSelectedChapter(updatedChapter);
    setChapters(
      chapters.map((ch) => (ch.id === selectedChapter.id ? updatedChapter : ch))
    );
  };

  /**
   * @function addChoice
   * @description Adiciona uma nova escolha ao capítulo selecionado.
   */
  const addChoice = () => {
    if (!selectedChapter) return;
  
    const updatedChoices = selectedChapter.choices.map(choice => ({
      ...choice,
      expanded: false,
    }));
  
    const newChoice: Choice & { expanded: boolean } = {
      id: uuidv4(),
      targets: [], // Inicializa destinations como um array vazio
      text: "",
      expanded: true,
    };
    handleChapterChange("choices", [...updatedChoices, newChoice]);
  };

  /**
   * @function updateChoice
   * @description Atualiza a escolha especificada do capítulo selecionado.
   * @param {number} index - O índice da escolha a ser atualizada.
   * @param {Choice} newChoice - O novo objeto de escolha.
   */
  const updateChoice = (index: number, newChoice: Choice) => {
    if (!selectedChapter) return;
    const updatedChoices = [...selectedChapter.choices];
    updatedChoices[index] = newChoice;

    // Recalcula a soma das probabilidades após a atualização
    const newSum = newChoice.targets?.reduce((sum, target) => sum + Number(target.probability), 0) || 0;
    setSumOfProbabilities(newSum);
    setProbabilityValidationMessage(newSum === 100 || newChoice.targets?.length === 0 ? null : `A soma das probabilidades é ${newSum}%, faltam ${100 - newSum}%.`);

    handleChapterChange("choices", updatedChoices); // Use handleChapterChange para atualizar o estado chapters
  };

  /**
   * @function addRequirementToChoice
   * @description Adiciona um novo requisito/custo à escolha especificada.
   * @param {number} index - O índice da escolha à qual adicionar o requisito/custo.
   */
  const addRequirementToChoice = (index: number) => {
    if (!selectedChapter) return;
    const choice = selectedChapter.choices[index];
    const newId = uuidv4();
    const newReq = { ...choice.requirement, [newId]: { id: newId, key: "", value: "", isCost: false, isHidden: false } };
    updateChoice(index, { ...choice, requirement: newReq });
  };

  const updateRequirementKey = (
    choiceIndex: number,
    requirementId: string,
    newKey: string
  ) => {
    const choice = selectedChapter?.choices[choiceIndex];
    if (!choice || !choice.requirement) return;

    const updatedReq = { ...choice.requirement };
    if (updatedReq[requirementId]) {
      updatedReq[requirementId] = {
        ...updatedReq[requirementId],
        key: newKey, // Atualiza a chave
      };
      const updatedChoices = [...selectedChapter.choices];
      updatedChoices[choiceIndex] = { ...choice, requirement: updatedReq };
      handleChapterChange("choices", updatedChoices);
    }
  };

  /**
   * @function updateRequirement
   * @description Atualiza um requisito/custo da escolha especificada.
   * @param {number} choiceIndex - O índice da escolha.
   * @param {string} keyName - A chave do requisito/custo a ser atualizado.
   * @param {string | null} newKey - A nova chave do requisito/custo.
   * @param {number | string} newValue - O novo valor do requisito/custo.
   * @param {boolean} isCost - Indica se o requisito/custo é um custo.
   */
  const updateRequirement = (
    choiceIndex: number,
    requirementId: string, // Use o ID do requisito
    newValue: number | string,
    isCost: boolean,
    isHidden: boolean
  ) => {
    const choice = selectedChapter?.choices[choiceIndex];
    if (!choice || !choice.requirement) return;
  
    const updatedReq = { ...choice.requirement };
    if (updatedReq[requirementId]) {
      updatedReq[requirementId] = {
        ...updatedReq[requirementId],
        value: newValue,
        isCost,
        isHidden,
      };
      const updatedChoices = [...selectedChapter.choices];
      updatedChoices[choiceIndex] = { ...choice, requirement: updatedReq };
      handleChapterChange("choices", updatedChoices);
    }
  };

  /**
   * @function removeRequirementFromChoice
   * @description Remove um requisito/custo da escolha especificada.
   * @param {number} choiceIndex - O índice da escolha.
   * @param {string} key - A chave do requisito/custo a ser removido.
   */
  const removeRequirementFromChoice = (choiceIndex: number, requirementId: string) => {
    if (!selectedChapter || !selectedChapter.choices[choiceIndex].requirement) return;
    const updatedReq = { ...selectedChapter.choices[choiceIndex].requirement };
    delete updatedReq[requirementId];
    const updatedChoices = [...selectedChapter.choices];
    updatedChoices[choiceIndex] = { ...selectedChapter.choices[choiceIndex], requirement: updatedReq };
    handleChapterChange("choices", updatedChoices);
  };

  /**
   * @function addOnStart
   * @description Adiciona um novo par chave/valor ao "on_start" do capítulo selecionado.
   */
  const addOnStart = () => {
    if (!selectedChapter) return;
    // Gera uma chave única usando um timestamp ou um UUID
    const newKey = `newKey_${Date.now()}`;
    const updatedOnStart = { ...selectedChapter.on_start, "": "" };
    handleChapterChange("on_start", updatedOnStart);
  };

  /**
   * @function removeOnStart
   * @description Remove um item do "on_start" do capítulo selecionado.
   * @param {string} key - A chave do item a ser removido.
   */
  const removeOnStart = (key: string) => {
    if (!selectedChapter || !selectedChapter.on_start) return;
    const updatedOnStart = { ...selectedChapter.on_start };
    delete updatedOnStart[key];
    handleChapterChange("on_start", Object.keys(updatedOnStart).length > 0 ? updatedOnStart : undefined);
  };

  /**
   * @function addChapter
   * @description Adiciona um novo capítulo à lista de capítulos.
   */
  const addChapter = () => {
    const newChapter: Chapter = {
      id: chapters.length + 1,
      title: `Capítulo ${chapters.length + 1}`,
      text: "",
      choices: [],
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapter(newChapter);
    setSelectedTab(0); // Define a aba principal para "ESCOLHAS" ao adicionar um capítulo

    // Rola para o final da lista
    if (chapterListRef.current) {
      chapterListRef.current.scrollTop = chapterListRef.current.scrollHeight;
    }
  };

  /**
   * @function removeChapter
   * @description Remove um capítulo da lista de capítulos.
   * @param {number} id - O ID do capítulo a ser removido.
   */
  const removeChapter = (id: number) => {
    const updatedChapters = chapters.filter((ch) => ch.id !== id);
    setChapters(updatedChapters);
    if (selectedChapter?.id === id) {
      setSelectedChapter(updatedChapters.length > 0 ? updatedChapters[0] : null);
    }
  };

  /**
   * @function saveJsonFile
   * @description Salva os dados dos capítulos em um arquivo JSON.
   * @param {string} fileName - O nome do arquivo a ser salvo (opcional).
   * Se fornecido, sobrescreve o arquivo existente. Caso contrário, permite salvar como novo arquivo.
   */
  const handleSaveGame = () => {
    saveJsonFile(chapters, onStartHiddenStatus, 'historia.json');
  };

  /**
   * @constant filterOptions
   * @description Configura as opções de filtragem para o Autocomplete.
   */
  const filterOptions = createFilterOptions<IChapterOption>({
    matchFrom: "start",
    stringify: (option: IChapterOption) => option.title,
  });

  /**
   * @function clearHistory
   * @description Limpa a história atual, removendo todos os capítulos.
   */
  const clearHistory = () => {
    setChapters([]);
    setSelectedChapter(null);
    setDialogAlert({ ...dialogAlert, open: false })
  };

  const confirmationDialog = () => {
    if (chapters.length > 0) {
      setDialogAlert({
        ...dialogAlert,
        open: true,
        message: `Deseja realmente limpar essa história?`
      });
    }
  }

  /**
   * @function loadJsonFile
   * @description Carrega os dados do arquivo JSON selecionado e atualiza o estado dos capítulos.
   */
  const loadJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const loadedChapters = Object.entries(jsonData.chapters).map(
          ([id, chapterDataUnknown]) => {
            const chapterData = chapterDataUnknown as IChapterDataJSON;
            return {
              id: Number(id),
              title: `Capítulo ${id}`,
              text: chapterData.text,
              choices: chapterData.choices.map((choiceJSON: IChoiceJSON) => {
                const targetsWithProbability = choiceJSON.targets?.length > 0 && typeof choiceJSON.targets[0] === 'object'
                  ? (choiceJSON.targets as { targetId: number; probability: number }[]).map(target => ({
                    targetId: Number(target.targetId), // Converte targetId para number
                    probability: Number(target.probability), // Converte probability para number
                  }))
                  : choiceJSON.targets?.map(targetStr => ({
                    targetId: Number(targetStr),
                    probability: 100 / (choiceJSON.targets?.length || 1),
                  })) || [];

                return {
                  id: uuidv4(),
                  targets: targetsWithProbability,
                  text: choiceJSON.text,
                  requirement: choiceJSON.requirement
                    ? Object.entries(choiceJSON.requirement).reduce(
                        (acc, [reqKey, reqData]) => {
                          const newRequirementId = uuidv4();
                          acc[newRequirementId] = {
                            key: reqKey,
                            value: reqData as number | string,
                            isCost: false,
                            isHidden: false,
                            id: newRequirementId,
                          };
                          return acc;
                        },
                        {} as Record<string, { key: string; value: number | string; isCost: boolean; isHidden: boolean; id?: string }>
                      )
                    : undefined,
                };
              }),
              on_start: chapterData.on_start,
            };
          }
        );
        setChapters(loadedChapters);
        setSelectedChapter(loadedChapters.length > 0 ? loadedChapters[0] : null);
        if (file) {
          setLoadedFileName(file.name);
        }
      } catch (error) {
        console.error("Erro ao carregar o arquivo JSON:", error);
      }
    };
    reader.readAsText(file);
  };

  /**
   * @function handleSaveClick
   * @description Abre o popup de confirmação para salvar o arquivo.
   */
  const handleSaveClick = () => {
    if (chapters.length === 0) {
      alert("Nenhum capítulo criado. O arquivo JSON não será gerado.");
      return; // Sai da função sem gerar o arquivo
    }
    setOpenDialog(true);
  };

  return (
      <Grid2 container sx={{ minHeight: 1, mt: 2 }}>
        <Grid2 size={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Capítulos</Typography>
            <List component={"nav" as any} sx={{ maxHeight: '520px', overflow: 'auto' }} ref={chapterListRef}>
              {chapters.map((ch) => {
                const isSelected = ch.id === selectedChapter?.id;
                return (
                  <ListItem key={ch.id} disablePadding>
                    <ListItemButton selected={isSelected} onClick={() => handleChapterSelect(ch)}
                      sx={{ bgcolor: isSelected ? "#ddd" : "transparent", "&:hover": { bgcolor: "#ccc" } }} >
                      <ListItemText primary={ch.title} />
                    </ListItemButton>
                    <IconButton onClick={() => removeChapter(ch.id)} edge="end">
                      <DeleteIcon color="error" />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Button onClick={addChapter} style={{ marginTop: "10px", width: "100%" }}>
                  ➕ Adicionar Capítulo
              </Button>
              <Divider sx={{ my: 2 }} />
              <Button variant="contained" onClick={handleSaveClick} fullWidth startIcon={<SaveIcon />}>
                Salvar
              </Button>
              <Divider sx={{ my: 2 }} />
              <Button variant="outlined" onClick={confirmationDialog} fullWidth startIcon={<AddIcon />}>
                Limpar
              </Button>
              <Divider sx={{ my: 2 }} />
              <input type="file" accept=".json" onChange={loadJsonFile} style={{ display: "none" }} id="load-json-file" />
              <label htmlFor="load-json-file">
                <Button variant="outlined" component="span" fullWidth startIcon={<FileUploadIcon />}>
                  Carregar
                </Button>
              </label>
            </Box>
          </Box>
        </Grid2>
        <Divider orientation="vertical" variant="fullWidth" flexItem/>
        <Grid2 size={"grow"}>
          {/* Conteúdo principal */}
          <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }} >

            {selectedChapter ? (
              <>
                <TextField label="Capítulo" value={selectedChapter.title} fullWidth margin="normal"
                  onChange={(e) => handleChapterChange("title", e.target.value)} />
                <TextField label="Texto do Capítulo" value={selectedChapter.text} fullWidth margin="normal" multiline rows={4}
                  onChange={(e) => handleChapterChange("text", e.target.value)} />

                {/* Abas */}
                <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mt: 2 }}>
                  <Tab label="Escolhas" />
                  <Tab label="Gatilhos do Capítulo" />
                </Tabs>

                {/* Aba Escolhas */}
                {selectedTab === 0 && (
                  <Box sx={{ mt: 3 }}>
                      {selectedChapter.choices.map((choice, index) => (
                        <Box>
                          <Accordion
                              key={index}
                              expanded={choice.expanded}
                              onChange={() => {
                                  const updatedChoices = [...selectedChapter.choices];
                                  updatedChoices[index].expanded = !updatedChoices[index].expanded;
                                  handleChapterChange("choices", updatedChoices);
                              }}
                              sx={{ mb: 2 }}
                          >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography>Escolha {index + 1}</Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={6}>
                                    <TextField
                                      label="Texto da Escolha"
                                      fullWidth
                                      value={choice.text}
                                      onChange={(e) => updateChoice(index, { ...choice, text: e.target.value })}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Autocomplete
                                      multiple
                                      fullWidth
                                      options={chapters
                                        .filter((chapter) => chapter.id !== selectedChapter?.id &&
                                          !choice.targets?.some(dest => dest.targetId === chapter.id))
                                        .map((chapter) => ({
                                          id: chapter.id,
                                          title: chapter.title,
                                        }))}
                                      getOptionLabel={(option: IChapterOption) => option.title}
                                      value={[]}
                                      onChange={(_, newValue) => {
                                        const currentTargets = choice.targets || [];
                                        const newDestinations = newValue.map(option => ({ targetId: option.id, probability: 0 }));
                                        const updatedTargets = [...currentTargets, ...newDestinations];
                                  
                                        if (updatedTargets.length === 1) {
                                          // Primeiro destino: preencher com 100 e manter disabled (por enquanto, controlaremos isso via estado local)
                                          updateChoice(index, { ...choice, targets: [{ ...updatedTargets[0], probability: 100 }] });
                                          setFirstDestinationAdded(true); // Usaremos um estado local para controlar o disabled
                                        } else if (updatedTargets.length > 1) {
                                          // Segundo destino ou mais: calcular a porcentagem e habilitar a edição
                                          const equalProbability = Math.floor(100 / updatedTargets.length);
                                          const remainder = 100 % updatedTargets.length;
                                  
                                          const finalTargets = updatedTargets.map((target, i) => ({
                                            ...target,
                                            probability: equalProbability + (i < remainder ? 1 : 0),
                                          }));
                                  
                                          updateChoice(index, { ...choice, targets: finalTargets });
                                          setFirstDestinationAdded(false); // Habilitar a edição
                                        } else {
                                          updateChoice(index, { ...choice, targets: [] });
                                          setFirstDestinationAdded(false);
                                        }
                                      }}
                                      renderInput={(params) => <TextField {...params} label="Adicionar Destinos" />}
                                      filterOptions={(options, params): IChapterOption[] => {
                                        const filtered = filterOptions(options, params);
                                        return params.inputValue.length > 2 ? filtered : [];
                                      }}
                                    />
                                  </Grid>
                                </Grid>

                                {choice.targets && choice.targets.length > 0 && (
                                  <List sx={{ width: '100%' }}>
                                    {choice.targets.map((target, targetIndex) => (
                                      <ListItem key={targetIndex} secondaryAction={
                                        <IconButton
                                          edge="end"
                                          aria-label="delete"
                                          onClick={() => {
                                            const updatedTargets = choice.targets.filter((_, i) => i !== targetIndex);

                                            if (updatedTargets.length === 1) {
                                              updateChoice(index, { ...choice, targets: [{ ...updatedTargets[0], probability: 100 }] });
                                              setFirstDestinationAdded(true);
                                            } else if (updatedTargets.length > 1) {
                                              const equalProbability = Math.floor(100 / updatedTargets.length);
                                              const remainder = 100 % updatedTargets.length;

                                              const finalTargets = updatedTargets.map((target, i) => ({
                                                ...target,
                                                probability: equalProbability + (i < remainder ? 1 : 0),
                                              }));
                                              updateChoice(index, { ...choice, targets: finalTargets });
                                              setFirstDestinationAdded(false); // Habilitar a edição
                                              setProbabilityErrors({}); // Limpar os erros ao recalcular
                                            } else {
                                              // Nenhum destino restante
                                              updateChoice(index, { ...choice, targets: [] });
                                              setFirstDestinationAdded(false);
                                              setProbabilityErrors({}); // Limpar os erros se não houver destinos
                                            }
                                          }}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      }>
                                        <Grid container spacing={2} sx={{ justifyContent: "flex-end", display: 'flex', alignItems: 'center' }}>
                                          <Grid item md={2}>
                                            <ListItemText
                                              primary={`Destino: ${
                                                chapters.find((ch) => ch.id === target.targetId)?.title || target.targetId
                                              }`}
                                            />
                                          </Grid>
                                          <Grid item md={2}>
                                          <TextField
                                            key={targetIndex}
                                            fullWidth
                                            label="Chance"
                                            type="number"
                                            value={target.probability}
                                            onFocus={() => setFocusedProbabilityField(targetIndex)}
                                            onBlur={() => setFocusedProbabilityField(null)}
                                            onChange={(e) => {
                                              const newProbability = Number(e.target.value);
                                              const currentTargets = choice.targets || [];
                                              const updatedTargetsWithNewProbability = currentTargets.map((t, i) =>
                                                i === targetIndex ? { ...t, probability: newProbability } : t
                                              );
                                              const sum = updatedTargetsWithNewProbability.reduce((s, t) => s + t.probability, 0);
                                              const newErrors = { ...probabilityErrors };
                                              newErrors[targetIndex] = null;

                                              if (sum > 100) {
                                                newErrors[targetIndex] = "A soma das probabilidades não pode exceder 100%.";
                                              }

                                              setProbabilityErrors(newErrors);
                                              setSumOfProbabilities(sum);

                                              if (sum < 100 && currentTargets.length > 0) {
                                                setLastModifiedFieldBelow100(targetIndex);
                                              } else if (sum === 100) {
                                                setLastModifiedFieldBelow100(null);
                                              }

                                              if (sum <= 100) {
                                                updateChoice(index, { ...choice, targets: updatedTargetsWithNewProbability });
                                              }
                                            }}
                                            inputProps={{ min: 0, max: 100 }}
                                            disabled={firstDestinationAdded && choice.targets?.length === 1}
                                            error={!!probabilityErrors[targetIndex]}
                                            helperText={
                                              probabilityErrors[targetIndex] ? (
                                                probabilityErrors[targetIndex]
                                              ) : (
                                                lastModifiedFieldBelow100 === targetIndex && sumOfProbabilities < 100 && choice.targets?.length > 0 ? (
                                                  <Typography variant="caption" color="warning">
                                                    A soma das probabilidades é {sumOfProbabilities}%, faltam {100 - sumOfProbabilities}%.
                                                  </Typography>
                                                ) : null
                                              )
                                            }
                                          />
                                          </Grid>
                                        </Grid>
                                      </ListItem>
                                    ))}
                                  </List>
                                )}

                                {/* Requisitos & Custos */}
                                <Typography variant="subtitle1">Requisitos & Custos</Typography>
                                  {choice.requirement &&
                                    Object.entries(choice.requirement).map(([id, req]) => (
                                      <Box key={id} sx={{ mb: 2 }}> {/* Um Box para cada requisito */}
                                        <FormControlLabel
                                          control={<Checkbox checked={req.isHidden} onChange={(e) => updateRequirement(index, id, req.value, req.isCost, e.target.checked)} />}
                                          label="Oculto?"
                                        />
                                        <Box sx={{ display: "flex", alignItems: "center" }}> {/* Box para alinhar os outros elementos */}
                                          <TextField
                                            label="Recurso"
                                            value={req.key}
                                            sx={{ width: "300px", mr: 1 }}
                                            onChange={(e) => updateRequirementKey(index, id, e.target.value)}
                                          />
                                          <TextField
                                            label="Valor"
                                            value={req.value}
                                            sx={{ width: "100px", mr: 1 }}
                                            onChange={(e) => updateRequirement(index, id, e.target.value, req.isCost, req.isHidden)}
                                          />
                                          <FormControlLabel
                                            control={<Checkbox checked={req.isCost} onChange={(e) => updateRequirement(index, id, req.value, e.target.checked, req.isHidden)} />}
                                            label="Consumir"
                                          />
                                          <IconButton onClick={() => removeRequirementFromChoice(index, id)}>
                                            <DeleteIcon color="error" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    ))
                                  }
                                  <Grid container>
                                    <Grid item md={3}>
                                      <Button variant="outlined" onClick={() => addRequirementToChoice(index)}>
                                          ➕ Adicionar Recurso
                                      </Button>
                                    </Grid>
                                  </Grid>
                              </AccordionDetails>
                          </Accordion>
                        </Box>
                      ))}
                      <Button variant="outlined" onClick={addChoice} sx={{ mt: 2 }}>
                      ➕ Adicionar Escolha
                      </Button>
                  </Box>
                )}

                {/* Aba On Start */}
                {selectedTab === 1 && (
                    <Box sx={{ mt: 3 }}>
                        {selectedChapter.on_start && (
                            Object.entries(selectedChapter.on_start).map(([key, value], index) => (
                              <Box key={`<span class="math-inline">\{key\}\-</span>{index}`} sx={{ mb: 2 }}> {/* Adiciona margem inferior para separar os itens */}
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isOnStartHidden(key)}
                                      onChange={(e) => handleOnStartHiddenChange(key, e.target.checked)}
                                    />
                                  }
                                  label="Oculto?"
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    label="Recurso"
                                    value={key}
                                    onChange={(e) => updateOnStartKey(key, e.target.value, value)}
                                    sx={{ mr: 1, width: "300px" }}
                                  />
                                  <TextField
                                    label="Valor"
                                    value={value}
                                    onChange={(e) => updateOnStartValue(key, e.target.value)}
                                    sx={{ mr: 1 }}
                                  />

                                  <IconButton onClick={() => removeOnStart(key)}>
                                      <DeleteIcon color="error" />
                                  </IconButton>
                                </Box>
                              </Box>
                          ))
                        )}
                        <Button variant="outlined" sx={{ mt: 1 }} onClick={addOnStart}>
                            ➕ Adicionar Gatilho
                        </Button>
                    </Box>
                )}
              </>
            ) : (
              <Typography variant="h5" align="center">
                Adicione um capítulo para começar...
              </Typography>
            )}
          </Box>
          <CustomAlertDialog open={dialogAlert.open} title={dialogAlert.title} message={dialogAlert.message} handleClickYes={clearHistory}
              handleClickNo={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
              handleClickClose={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
          />
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Salvar Arquivo</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {loadedFileName
                  ? `O arquivo original "${loadedFileName}" não será sobrescrito. Um novo arquivo será baixado com o mesmo nome.`
                  : "Deseja salvar como um novo arquivo?"}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button variant="contained"
                onClick={() => {
                  setOpenDialog(false);
                  handleSaveGame();
                }}>
                Salvar
              </Button>
            </DialogActions>
          </Dialog>
        </Grid2>
      </Grid2>
  );
};

export default BookEditor;
