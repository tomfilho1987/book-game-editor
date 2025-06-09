/**
 * @file BookEditor.tsx
 * @description Componente responsável por editar os capítulos do livro-jogo.
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 1.0
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Box, Button, Checkbox, Divider, IconButton, FormControlLabel, List, ListItem, ListItemButton, ListItemText, Tab, Tabs, TextField, Typography,
    Autocomplete, createFilterOptions, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    Grid2, Grid} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import { Chapter, OnStartItem } from "../Types/Chapter";
import { Choice } from "../Types/Choice";
import { IChapterOption } from "../Interfaces/IChapterOption";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { v4 as uuidv4 } from 'uuid';
import { ICustomDialogAlert } from "../Interfaces/ICustomDialogAlert";
import CustomAlertDialog from "../Components/CustomAlertDialog";
import CustomDialogInformacao from "../Components/CustomDialogInformacao";
import { saveJsonFile } from "../Utils/saveGameData";
import { validarProbabilidades } from "../Utils/validarProbabilidades";
import validateChoices from "../Utils/validateChoices";
import validateStartChapter from "../Utils/validateStartChapter";
import { IGameConfig, IResource } from "../Interfaces/IGameConfig";
import { useJsonLoader } from "../Utils/useJsonLoader";
import StoryMindMap from "./MapaMental/StoryMindMap";
import CloseIcon from '@mui/icons-material/Close'; // <--- Ícone de Fechar para o Dialog

const initialData: Chapter[] = JSON.parse(localStorage.getItem("bookData") || "[]") || [
  {
    id: 1,
    title: "Capítulo 1",
    text: "Você está em uma floresta sombria...",
    choices: [ { target: 2, text: "Seguir a trilha" }, { target: 3, text: "Entrar na caverna" }, ],
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
  const chapterListRef = useRef<HTMLDivElement>(null);
  const [dialogAlert, setDialogAlert] = React.useState<ICustomDialogAlert>({ open: false, title: 'Confirma Operação?', message: '', param: '' })
  const [dialogInfo, setDialogInfo] = React.useState<ICustomDialogAlert>({ open: false, title: 'Aviso', message: '', param: '' })
  const [deleteChapterDialog, setDeleteChapterDialog] = React.useState<ICustomDialogAlert>({ open: false, title: '', message: '', param: 0 })
  const [deleteChoiceDialog, setDeleteChoiceDialog] = React.useState<ICustomDialogAlert>({ open: false, title: 'Confirma Exclusão?', message: '', param: 0 })
  const [onStartHiddenStatus, setOnStartHiddenStatus] = useState<Record<number, Record<string, boolean>>>({});
  const [firstDestinationAdded, setFirstDestinationAdded] = useState(false);
  const [probabilityErrors, setProbabilityErrors] = useState<Record<number, string | null>>({});
  const [config, setConfig] = useState<Array<IGameConfig>>([]);

  const [sumOfProbabilities, setSumOfProbabilities] = useState<number>(0);
  const [probabilityValidationMessage, setProbabilityValidationMessage] = useState<string | null>(null);
  /** Índice da escolha sendo editada */
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState<number>(0);
  const [focusedProbabilityField, setFocusedProbabilityField] = useState<number | null>(null);
  const [lastModifiedFieldBelow100, setLastModifiedFieldBelow100] = useState<number | null>(null);
  /** Novo estado para controlar o erro de validação do título */
  const [titleError, setTitleError] = useState<string | null>(null);
  /** Novo estado para controlar o erro de validação do texto */
  const [textError, setTextError] = useState<string | null>(null);
  /** Estado para controlar a aba principal selecionada (0: Gatilhos, 1: Escolhas). */
  const [selectedTab, setSelectedTab] = useState(0);
  /** hook customizado para carrregar arquivo */
  const { loadJsonFile } = useJsonLoader({ setChapters, setSelectedChapter, setLoadedFileName, setConfig });
  /** Estado para controlar a visibilidade do mapa mental */
  const [showMindMap, setShowMindMap] = useState(false);
  /** Estado para controlar a abertura do modal */
  const [openMindMapModal, setOpenMindMapModal] = useState(false);
  const recursosUsados = useMemo(() => extrairRecursosDeChoices(chapters), [chapters]);
  const currentChapterIndex = chapters.findIndex(ch => ch.id === selectedChapter?.id);
  const currentChapter = currentChapterIndex !== -1 ? chapters[currentChapterIndex] : null;
  const currentChoice = currentChapter?.choices[currentChoiceIndex];
  const isDevelopment = process.env.NODE_ENV === 'development';

  type RecursoOption = { key: string; label: string; };

  
  /**
   * @function handleChapterChange
   * @description Atualiza o campo especificado do capítulo selecionado e realiza validação no título e texto.
   * @param {keyof Chapter} field - O campo do capítulo a ser atualizado.
   * @param {any} value - O novo valor para o campo.
   */
  const handleChapterChange = (field: keyof Chapter, value: any) => {
    if (!selectedChapter) return;

    if (field === 'title') {
      if (value.length < 3) {
        setTitleError('O título deve ter no mínimo 3 caracteres para ser salvo.');
      } else if (titleError) {
        setTitleError(null);
      }
    } else if (field === 'text') {
      if (!value || value.trim() === '') {
        setTextError('O texto do capítulo é obrigatório.');
      } else if (textError) {
        setTextError(null);
      } 
    }

    const updatedChapter = { ...selectedChapter, [field]: value };
    setSelectedChapter(updatedChapter);

    setChapters(prevChapters => {
      return prevChapters.map(ch => {
        if (ch.id === selectedChapter.id) {
          return { ...updatedChapter, [field]: value };
        }
        // Se o campo que está sendo alterado é 'isStartChapter' e o novo valor é true,
        // desmarca todos os outros capítulos
        if (field === 'isStartChapter' && value === true) {
          return { ...ch, isStartChapter: false };
        }
        return ch;
      });
    });
  };

  function extrairRecursosDeChoices(chapters: Chapter[]): RecursoOption[] {
    const map = new Map<string, boolean>();

    chapters.forEach(ch => {
      ch.choices.forEach(choice => {
        if (choice.requirement) {
          Object.values(choice.requirement).forEach(({ key, isHidden }) => {
            map.set(key, map.get(key) || isHidden); // marca como oculto se algum for oculto
          });
        }
      });
    });

    return Array.from(map.entries()).map(([key, isHidden]) => ({ key, label: isHidden ? `${key} (Oculto)` : key }));
  }

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedTab(0); // Define a aba principal para "ESCOLHAS" ao selecionar um capítulo
  };

  const ensureOnStartItems = (onStartData: Record<string, string | number | { value: string | number; isHidden?: boolean }> | OnStartItem[] | undefined): OnStartItem[] => {
      if (!onStartData) {
          return [];
      }

      if (Array.isArray(onStartData)) {
        return onStartData.map(item => ({
          id: item.id || uuidv4(),
          key: item.key,
          value: item.value,
          isHidden: item.isHidden,
        }));
      }

      const normalizedArray: OnStartItem[] = [];
      Object.entries(onStartData).forEach(([key, rawValue]) => {
        let isHidden = false;
        let resourceKey = key.trim();

        if (resourceKey.startsWith('#') || resourceKey.startsWith('@')) {
          isHidden = true;
          resourceKey = resourceKey.substring(1);
        }
        
        let finalValue: string;

        if (typeof rawValue === 'number' || typeof rawValue === 'string') {
          finalValue = String(rawValue);
        } else if (typeof rawValue === 'object' && rawValue !== null) {
          if ('isHidden' in rawValue && typeof rawValue.isHidden === 'boolean') {
            isHidden = rawValue.isHidden;
          }
          if ('value' in rawValue && (typeof rawValue.value === 'string' || typeof rawValue.value === 'number')) {
            finalValue = String(rawValue.value);
          } else {
            console.warn(`[ensureOnStartItems] Item '${key}' dentro do objeto tem um valor inesperado para 'value': '${rawValue.value}'. Convertido para string vazia.`);
            finalValue = '';
          }
        } else {
          console.warn(`[ensureOnStartItems] Item '${key}' tem formato inesperado: '${rawValue}'. Convertido para string vazia.`);
          finalValue = '';
        }

        if (resourceKey) {
          normalizedArray.push({
            id: uuidv4(),
            key: resourceKey,
            value: finalValue,
            isHidden: isHidden,
          });
        }
      });
      return normalizedArray;
  };

  /**
   * @function addOnStart
   * @description Adiciona um novo par chave/valor ao "on_start" do capítulo selecionado.
   */
  const addOnStartItem = useCallback(() => {
    if (!selectedChapter) return;

    const currentOnStart = ensureOnStartItems(selectedChapter.on_start);
    const newItem: OnStartItem = {
      id: uuidv4(),
      key: "",
      value: "0",
      isHidden: false
    };

    const updatedOnStart = [...currentOnStart, newItem];
    handleChapterChange("on_start", updatedOnStart);
  }, [selectedChapter, handleChapterChange]);

  // Função para atualizar um item on_start (seja key, value ou isHidden)
  const updateOnStartItem = useCallback((idToUpdate: string, field: keyof OnStartItem, newValue: string | boolean) => {
    if (!selectedChapter) return;

    // Garante que currentOnStart seja um array
    const currentOnStart = ensureOnStartItems(selectedChapter.on_start);
    const updatedOnStart = currentOnStart.map(item => {
        if (item.id === idToUpdate) {
            if (field === 'key') {
                const newKeyString = newValue as string;
                if (!newKeyString.trim()) {
                    console.warn("Chave do recurso não pode ser vazia.");
                    return item;
                }
                if (currentOnStart.some(existing => existing.key === newKeyString && existing.id !== idToUpdate)) {
                    console.warn(`Chave '${newKeyString}' já existe.`);
                    return item;
                }
                
                let newIsHidden = item.isHidden;
                if (newKeyString.startsWith('#') || newKeyString.startsWith('@')) {
                    newIsHidden = true;
                } else if (item.isHidden && !newKeyString.startsWith('#') && !newKeyString.startsWith('@')) {
                    // Sua lógica para o que acontece se o prefixo é removido
                }

                return { ...item, key: newKeyString, isHidden: newIsHidden };
            }
            return { ...item, [field]: newValue };
        }
        return item;
    });

    handleChapterChange("on_start", updatedOnStart);
  }, [selectedChapter, handleChapterChange]);

  /**
   * @function removeOnStartItem
   * @description Remove um item do "on_start" do capítulo selecionado.
   * @param {string} idToRemove - A chave do item a ser removido.
   */
    const removeOnStartItem = useCallback((idToRemove: string) => {
        if (!selectedChapter) return;
        // Garante que currentOnStart seja um array
        const currentOnStart = ensureOnStartItems(selectedChapter.on_start);
        const updatedOnStart = currentOnStart.filter(item => item.id !== idToRemove);
        handleChapterChange("on_start", updatedOnStart);
    }, [selectedChapter, handleChapterChange]);

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
      targets: [],
      text: "",
      expanded: true,
      name: `Escolha ${selectedChapter.choices.length + 1}`,
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
   * @function addChapter
   * @description Adiciona um novo capítulo à lista de capítulos.
   */
  const addChapter = () => {
    const maxId = chapters.reduce((max, chapter) => Math.max(max, chapter.id), 0);
  
    const newChapter: Chapter = {
      id: maxId + 1,
      title: `Capítulo ${maxId + 1}`,
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
   * @function handleSaveClick
   * @description Abre o popup de confirmação para salvar o arquivo.
   */
  const handleSaveClick = () => {
    if (chapters.length === 0) {
      setDialogInfo({ ...dialogInfo, open: true, message: "Nenhum capítulo criado. O arquivo JSON não será gerado." });
      return;
    }

    const validationResultEscolha = validateChoices(chapters);
    if (!validationResultEscolha.isValid) {
      setDialogInfo({ ...dialogInfo, open: true, message: validationResultEscolha.message });
      return;
    }

    const startChapterValidationResult = validateStartChapter(chapters);
    if (!startChapterValidationResult.isValid) {
      setDialogInfo({ ...dialogInfo, open: true, message: startChapterValidationResult.message });
      return;
    }

    const validationResult = validarProbabilidades(chapters);
    if (validationResult === true) {
        saveJsonFile(chapters, 'historia.json');
    } else if (typeof validationResult === 'string') {
      setDialogInfo({ ...dialogInfo, open: true,  message: validationResult });
    }
  };

  const handleCloseModal = () => {
    setDialogInfo({ ...dialogInfo, open: false, message: '' })
  };

  /**
   * @function removeChoice
   * @description Remove uma escolha da lista de escolhas de um capítulo com base no seu ID.
   * @param {number} choiceIndex - O ID da escolha a ser removida.
   */
  const removeChoice = (choiceIndex: number) => {
    if (!selectedChapter) return;

    const updatedChoices = selectedChapter.choices.filter((_, index) => index !== choiceIndex);
    handleChapterChange("choices", updatedChoices);

    // Se a escolha removida era a atualmente selecionada para edição,
    // resetamos o índice para evitar erros.
    if (currentChoiceIndex === choiceIndex && updatedChoices.length > 0) {
      setCurrentChoiceIndex(0);
    } else if (currentChoiceIndex === choiceIndex && updatedChoices.length === 0) {
      setCurrentChoiceIndex(0); // Ou talvez null, dependendo da sua lógica de edição
    } else if (currentChoiceIndex > choiceIndex) {
      setCurrentChoiceIndex(prevIndex => prevIndex - 1);
    }
  };

  /**
   * @function removeChapter
   * @description Remove um capítulo da lista de capítulos com base no seu ID e seleciona o capítulo vizinho apropriado.
   * @param {number} chapterIdToRemove - O ID do capítulo a ser removido.
   */
  const removeChapter = (chapterIdToRemove: number) => {
    const indexToRemove = chapters.findIndex(chapter => chapter.id === chapterIdToRemove);
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterIdToRemove);
    setChapters(updatedChapters);

    // Lógica para selecionar o próximo/anterior capítulo
    if (selectedChapter?.id === chapterIdToRemove) {
      if (updatedChapters.length > 0) {
        if (indexToRemove === 0) {
          // Caso 1: Primeiro capítulo removido, seleciona o próximo
          setSelectedChapter(updatedChapters[0]);
        } else if (indexToRemove === chapters.length - 1) {
          // Caso 2: Último capítulo removido, seleciona o anterior
          setSelectedChapter(updatedChapters[updatedChapters.length - 1]);
        } else {
          // Caso 3: Capítulo do meio removido, seleciona o anterior
          setSelectedChapter(updatedChapters[indexToRemove - 1]);
        }
      } else {
        // Se não há mais capítulos após a remoção
        setSelectedChapter(null);
      }
    }
  };

  const handleConfirmDeleteChapter = () => {
    if (deleteChapterDialog.param !== null) {
      removeChapter(Number(deleteChapterDialog.param));
    }
    setDeleteChapterDialog({ ...deleteChapterDialog, open: false, param: 0 });
  };

  const handleConfirmDeleteChoice = () => {
    if (deleteChoiceDialog.param !== null) {
      removeChoice(deleteChoiceDialog.param as number);
    }
    setDeleteChoiceDialog({ ...deleteChoiceDialog, open: false, param: 0 });
  };
  
  const handleOpenMindMap = () => setOpenMindMapModal(true);
  const handleCloseMindMap = () => setOpenMindMapModal(false);
  const onStartItems = ensureOnStartItems(selectedChapter?.on_start);
  
  return (
      <Grid2 container sx={{ minHeight: 1, mt: 2 }}>
        <Grid2 size={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Capítulos</Typography>
            <List component={"nav" as any} sx={{ maxHeight: '440px', overflow: 'auto' }} ref={chapterListRef}>
              {chapters.map((ch) => {
                const isSelected = ch.id === selectedChapter?.id;
                return (
                  <ListItem key={ch.id} disablePadding>
                    <ListItemButton selected={isSelected} onClick={() => handleChapterSelect(ch)}
                      sx={{ bgcolor: isSelected ? "#ddd" : "transparent", "&:hover": { bgcolor: "#ccc" } }} >
                      <ListItemText primary={ch.title} />
                    </ListItemButton>
                    <IconButton edge="end" aria-label="delete" 
                      onClick={() => 
                        setDeleteChapterDialog({ 
                          open: true, 
                          title: 'Remover Capítulo?', 
                          message: `Deseja remover o capítulo "${ch.title}"?`, 
                          param: ch.id.toString()
                        })
                      }>
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
              <Button variant="contained" onClick={handleSaveClick} fullWidth startIcon={<DownloadIcon />}>
                Salvar
              </Button>
              <Divider sx={{ my: 2 }} />
              <Button variant="outlined" onClick={confirmationDialog} fullWidth startIcon={<ClearIcon />}>
                Limpar
              </Button>
              <Divider sx={{ my: 2 }} />
              <input type="file" accept=".json" onChange={loadJsonFile} style={{ display: "none" }} id="load-json-file" />
              <label htmlFor="load-json-file">
                <Button variant="outlined" component="span" fullWidth startIcon={<UploadFileIcon />}>
                  Carregar
                </Button>
              </label>
              {isDevelopment && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button variant="outlined" onClick={handleOpenMindMap} fullWidth style={{ display: !(chapters.length > 0) ? "none" : "block" }} >
                    Mostrar Mapa Mental
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Grid2>
        <Divider orientation="vertical" variant="fullWidth" flexItem/>
        <Grid2 size={"grow"}>
          <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
            {selectedChapter ? (
              <>
                <FormControlLabel
                  control={<Checkbox
                    checked={selectedChapter?.isStartChapter || false}
                    onChange={(e) => handleChapterChange('isStartChapter', e.target.checked)}
                    name={`isStartChapter-${selectedChapter?.id}`}
                  />}
                  label="Capítulo Inicial"
                />
                <br />
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                  Os campos com (*) são obrigatórios!
                </Typography>

                <TextField required label="Capítulo" value={selectedChapter.title} fullWidth margin="normal"
                  onChange={(e) => handleChapterChange("title", e.target.value)}
                  error={!!titleError}
                  helperText={titleError}
                  sx={{ mb: 2 }}
                />
                <TextField required label="Texto do Capítulo" value={selectedChapter.text} fullWidth margin="normal" multiline rows={4}
                  onChange={(e) => handleChapterChange("text", e.target.value)}
                  error={!!textError}
                  helperText={textError}
                  sx={{ mb: 2 }}
                />
                <TextField label="Nome da Imagem (.jpg ou .png)" value={selectedChapter.image || ""} fullWidth margin="normal"
                  onChange={(e) => { handleChapterChange("image", e.target.value); }}
                  onBlur={() => {
                    if (selectedChapter.image &&
                          selectedChapter.image !== "" &&
                            !selectedChapter.image.toLowerCase().endsWith(".jpg") &&
                              !selectedChapter.image.toLowerCase().endsWith(".png")) {
                                setDialogInfo({ ...dialogInfo, open: true, message: "O nome da imagem deve ter a extensão .jpg ou .png"})
                    }
                  }}
                />
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
                              sx={{ mb: 2 }} >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                  <Typography sx={{ flexShrink: 0 }}>Escolha {index + 1}</Typography>
                                  {choice.text && (
                                    <Typography variant="body2" color="textSecondary" noWrap sx={{ ml: 2, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {"(" + choice.text + ")"}
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton aria-label="excluir" sx={{ ml: 'auto' }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDeleteChoiceDialog({ ...deleteChoiceDialog, open: true, param: index, message: 'Deseja realmente excluir esta Escolha?' });
                                  }} >
                                  <DeleteIcon />
                                </IconButton>           
                              </AccordionSummary>
                              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={6}>
                                    <TextField label="Texto da Escolha" fullWidth value={choice.text}
                                      onChange={(e) => updateChoice(index, { ...choice, text: e.target.value })} />
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Autocomplete multiple fullWidth
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
                                      <ListItem key={targetIndex}
                                        secondaryAction={
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
                                                setProbabilityErrors({});
                                              } else {
                                                // Nenhum destino restante
                                                updateChoice(index, { ...choice, targets: [] });
                                                setFirstDestinationAdded(false);
                                                setProbabilityErrors({});
                                              }
                                            }} >
                                            <DeleteIcon />
                                          </IconButton>
                                        }>
                                        <Grid container spacing={2} sx={{ justifyContent: "flex-end", display: 'flex', alignItems: 'center' }}>
                                          <Grid item md={2}>
                                            <ListItemText
                                              primary={`Destino: ${
                                                chapters.find((ch) => ch.id === target.targetId)?.title || target.targetId
                                              }`} />
                                          </Grid>
                                          <Grid item md={2}>
                                          <TextField key={targetIndex} fullWidth label="Chance" type="number"
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
                                          label="Oculto?" />
                                        <Box sx={{ display: "flex", alignItems: "center" }}> {/* Box para alinhar os outros elementos */}
                                          <Autocomplete
                                            freeSolo
                                            disableClearable
                                            options={recursosUsados}
                                            getOptionLabel={(option) => {
                                              if (typeof option === "string") return option;
                                              return option.label;
                                            }}
                                            filterOptions={(options, state) => {
                                              const input = state.inputValue.trim().toLowerCase();
                                              if (input.length < 3) return [];

                                              return options.filter(opt =>
                                                opt.key.toLowerCase().includes(input) &&
                                                opt.key.toLowerCase() !== input
                                              );
                                            }}
                                            value={req.key} // <-- usa diretamente o string
                                            onChange={(_, newValue) => {
                                              if (typeof newValue === "string") {
                                                updateRequirementKey(index, id, newValue);
                                              } else if (newValue && typeof newValue === "object") {
                                                updateRequirementKey(index, id, newValue.key);
                                              }
                                            }}
                                            onInputChange={(_, newInputValue) => {
                                              updateRequirementKey(index, id, newInputValue);
                                            }}
                                            renderOption={(props, option) => (
                                              <li {...props} key={option.key}>
                                                {option.label}
                                              </li>
                                            )}
                                            sx={{ width: "300px", mr: 1 }}
                                            renderInput={(params) => (
                                              <TextField {...params} label="Recurso" />
                                            )}
                                            isOptionEqualToValue={(option, value) => {
                                              // Garante comparação correta entre opção e valor atual
                                              if (typeof value === "string") return option.key === value;
                                              return option.key === value.key;
                                            }}
                                          />
                                          <TextField label="Valor" value={req.value} sx={{ width: "100px", mr: 1 }}
                                            onChange={(e) => updateRequirement(index, id, e.target.value, req.isCost, req.isHidden)} />
                                          <FormControlLabel
                                            control={<Checkbox checked={req.isCost} onChange={(e) => updateRequirement(index, id, req.value, e.target.checked, req.isHidden)} />}
                                            label="Consumir" />
                                          <IconButton onClick={() => removeRequirementFromChoice(index, id)}>
                                            <DeleteIcon color="error" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    ))
                                  }
                                  <Grid container>
                                    <Grid item md={3}>
                                      <Button variant="contained" onClick={() => addRequirementToChoice(index)} startIcon={<AddIcon />}>
                                        Adicionar Recurso
                                      </Button>
                                    </Grid>
                                  </Grid>
                              </AccordionDetails>
                          </Accordion>
                        </Box>
                      ))}
                      <Button variant="contained" onClick={addChoice} sx={{ mt: 2 }} startIcon={<AddIcon />}>
                        Adicionar Escolha
                      </Button>
                  </Box>
                )}

                {/* Gatilhos do capítulo */}
                {selectedTab === 1 && (
                  <Box sx={{ mt: 3 }}>
                    {onStartItems.map((item, index) => (
                      <Box key={item.id} sx={{ mb: 2, border: '1px solid #ddd', p: 2, borderRadius: '4px' }}> {/* Use item.id como key */}
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={item.isHidden}
                                      onChange={(e) => updateOnStartItem(item.id, 'isHidden', e.target.checked)}
                                  />
                              }
                              label="Oculto"
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                  label="Recurso"
                                  value={item.key} // O valor agora é item.key
                                  onChange={(e) => updateOnStartItem(item.id, 'key', e.target.value)}
                                  sx={{ mr: 1, width: "300px" }}
                              />
                              <TextField
                                  label="Valor"
                                  value={item.value}
                                  onChange={(e) => updateOnStartItem(item.id, 'value', e.target.value)}
                                  type="text" // Pode ser string, então 'text' é seguro
                                  sx={{ mr: 1 }}
                              />
                              <IconButton onClick={() => removeOnStartItem(item.id)}>
                                  <DeleteIcon />
                              </IconButton>
                          </Box>
                      </Box>
                    ))}
                      <Button variant="contained" sx={{ mt: 1 }} onClick={addOnStartItem} startIcon={<AddIcon />}>
                        Adicionar Gatilho
                      </Button>
                      {/* {selectedChapter.on_start && (
                        Object.entries(ensureOnStartItems(selectedChapter.on_start)).map(([key, item], index) => {
                          console.log(`Rendering TextField for key: '${key}', item.id: '${item.id}'`);
                          return (
                              <Box key={item.id} sx={{ mb: 2 }}>
                                  <FormControlLabel
                                      control={
                                          <Checkbox
                                              checked={item.isHidden}
                                              onChange={(e) => {
                                                  if (!selectedChapter) return;
                                                  const currentOnStart = ensureOnStartItems(selectedChapter.on_start);
                                                  const existingItem = currentOnStart[key]; // key do map é o nome do recurso
                                                  if (existingItem) {
                                                      const updatedOnStart: Record<string, OnStartItem> = {
                                                          ...currentOnStart,
                                                          [key]: { // Atualize o item pelo nome do recurso
                                                              ...existingItem,
                                                              isHidden: e.target.checked
                                                          }
                                                      };
                                                      handleChapterChange("on_start", updatedOnStart);
                                                      // Se você ainda precisa de setOnStartHiddenStatus por algum motivo, atualize-o
                                                      setOnStartHiddenStatus(prevStatus => ({
                                                          ...prevStatus,
                                                          [selectedChapter.id]: {
                                                              ...(prevStatus[selectedChapter.id] || {}),
                                                              [key]: e.target.checked
                                                          }
                                                      }));
                                                  }
                                              }}
                                          />
                                      }
                                      label="Oculto"
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <TextField
                                          label="Recurso"
                                          value={key} // O valor exibido ainda é a chave (nome do recurso)
                                          onChange={(e) => updateOnStartKey(key, e.target.value)}
                                          sx={{ mr: 1, width: "300px" }}
                                      />
                                      <TextField
                                          label="Valor"
                                          value={item.value}
                                          onChange={(e) => updateOnStartValue(key, e.target.value)}
                                          sx={{ mr: 1 }}
                                      />
                                      <IconButton onClick={() => removeOnStart(key)}>
                                          <DeleteIcon />
                                      </IconButton>
                                  </Box>
                              </Box>
                          );
                        })
                      )}
                      <Button variant="outlined" sx={{ mt: 1 }} onClick={addOnStart}>
                          ➕ Adicionar Gatilho
                      </Button> */}
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="h5" align="center">
                Adicione um capítulo para começar...
              </Typography>
            )}
          </Box>
          <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
            {showMindMap && chapters && chapters.length > 0 && (
                <Box sx={{ mt: 4, height: '700px', width: '100%', border: '1px solid #ddd' }}>
                    <Typography variant="h6" gutterBottom>Mapa Mental da História</Typography>
                    <StoryMindMap chapters={chapters} />
                </Box>
            )}
          </Box>
          <CustomDialogInformacao titulo={dialogInfo.title} abrirModal={dialogInfo.open} handleFechar={handleCloseModal} mensagem={dialogInfo.message} />
          <CustomAlertDialog open={dialogAlert.open} title={dialogAlert.title} message={dialogAlert.message} handleClickYes={clearHistory}
              handleClickNo={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
              handleClickClose={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
          />
          <CustomAlertDialog open={deleteChapterDialog.open} title={deleteChapterDialog.title} message={deleteChapterDialog.message} handleClickYes={handleConfirmDeleteChapter}
              handleClickNo={() => { setDeleteChapterDialog({ ...deleteChapterDialog, open: false }) }}
              handleClickClose={() => { setDeleteChapterDialog({ ...deleteChapterDialog, open: false }) }}
          />
          <CustomAlertDialog open={deleteChoiceDialog.open} title={deleteChoiceDialog.title} message={deleteChoiceDialog.message} handleClickYes={handleConfirmDeleteChoice}
              handleClickNo={() => { setDeleteChoiceDialog({ ...deleteChoiceDialog, open: false }) }}
              handleClickClose={() => { setDeleteChoiceDialog({ ...deleteChoiceDialog, open: false }) }}
          />
          <Dialog
              open={openMindMapModal}
              onClose={handleCloseMindMap}
              maxWidth={false} // Define o tamanho máximo do dialog (xs, sm, md, lg, xl, false)
              fullWidth={true} // Faz o dialog ocupar a largura máxima definida por maxWidth
              // Se quiser que o dialog ocupe a tela inteira em qualquer tamanho de tela:
              fullScreen={true}
              // PaperProps={{ sx: { height: '90%' } }} // Controla a altura do Paper dentro do Dialog
          >
              <DialogTitle id="mind-map-dialog-title">
                  Mapa Mental da História
                  {/* Botão de fechar no canto superior direito do título */}
                  <IconButton
                      aria-label="close"
                      onClick={handleCloseMindMap}
                      sx={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          color: (theme) => theme.palette.grey[500],
                      }}
                  >
                      <CloseIcon />
                  </IconButton>
              </DialogTitle>
              
              <DialogContent dividers sx={{ flexGrow: 1, p: 0 }}>
                  <div style={{ width: '100%', height: '100%' }}>
                      {chapters && (
                          <StoryMindMap chapters={Object.values(chapters)} />
                      )}
                  </div>
              </DialogContent>
              <DialogActions>
                  <Button onClick={handleCloseMindMap}>Fechar</Button>
              </DialogActions>
          </Dialog>
        </Grid2>
      </Grid2>
  );
};

export default BookEditor;
