/**
 * @file BookEditor.tsx
 * @description Componente responsável por editar os capítulos do livro-jogo.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Checkbox, Divider, Drawer, IconButton, FormControlLabel,
    List, ListItem, ListItemButton, ListItemText, Tab, Tabs, TextField, Toolbar, Typography,
    Autocomplete, createFilterOptions, Accordion, AccordionSummary, AccordionDetails,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from '@mui/icons-material/FileUpload';

import { Chapter } from "../Types/Chapter";
import { Choice } from "../Types/Choice";
import { IChapterOption } from "../Interfaces/IChapterOption";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IChoiceJSON } from "../Interfaces/JSON/IChoiceJSON ";
import { IChapterDataJSON } from "../Interfaces/JSON/IChapterDataJSON";
import { v4 as uuidv4 } from 'uuid';

const drawerWidth = 280;

const initialData: Chapter[] =
  JSON.parse(localStorage.getItem("bookData") || "[]") || [
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
  /** Estado para controlar a aba selecionada (On Start ou Escolhas). */
  const [tabIndex, setTabIndex] = useState(0); // Controla as abas

  /** Estado para armazenar o nome do arquivo JSON carregado. */
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  /** Estado para controlar a abertura do diálogo de salvar. */
  const [openDialog, setOpenDialog] = useState(false);

  const chapterListRef = useRef<HTMLDivElement>(null);

  const [onStartHiddenStatus, setOnStartHiddenStatus] = useState<Record<number, Record<string, boolean>>>({});

  const getOnStartHiddenStatus = (chapterId: number, key: string): boolean => {
    return onStartHiddenStatus[chapterId]?.[key] || false;
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

  useEffect(() => {
      if (chapterListRef.current) {
          chapterListRef.current.scrollTop = chapterListRef.current.scrollHeight;
      }
  }, [chapters]); // Rola para o final da lista sempre que a lista de capítulos for atualizada

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

    // Fecha todos os accordions existentes
    const updatedChoices = selectedChapter.choices.map(choice => ({
      ...choice,
      expanded: false,
    }));

    const newChoice: Choice & { expanded: boolean } = {
        id: uuidv4(),
        target: 0,
        text: "",
        expanded: true, // Inicializa o accordion como expandido
    };
    handleChapterChange("choices", [...updatedChoices, newChoice]);
  };

  /**
   * @function removeChoice
   * @description Remove a escolha especificada do capítulo selecionado.
   * @param {number} index - O índice da escolha a ser removida.
   */
  const removeChoice = (index: number) => {
    if (!selectedChapter) return;
    const updatedChoices = selectedChapter.choices.filter((_, i) => i !== index);
    handleChapterChange("choices", updatedChoices);
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
   * @function updateOnStart
   * @description Atualiza um item dentro do "on_start" do capítulo selecionado.
   * @param {string} oldKey - A chave antiga do item.
   * @param {string | null} newKey - A nova chave do item.
   * @param {number | string} newValue - O novo valor do item.
   */
  const updateOnStart = (oldKey: string, newKey: string, newValue: number | string) => {
    if (!selectedChapter || !selectedChapter.on_start) return;
  
    const updatedOnStart: Record<string, number | string> = {};
  
    Object.entries(selectedChapter.on_start).forEach(([key, value]) => {
      if (key === oldKey) {
        updatedOnStart[newKey] = newValue;
      } else {
        updatedOnStart[key] = value;
      }
    });
  
    // Atualiza o estado com o novo objeto on_start
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
    setTabIndex(0); // Garante que a aba "On Start" esteja ativa

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
  const saveJsonFile = (fileName?: string) => {
    const jsonStructure = {
      chapters: chapters.reduce((acc, chapter) => {
        const updatedOnStart: Record<string, number | string> = {};
        if (chapter.on_start) {
          Object.entries(chapter.on_start).forEach(([key, value]) => {
            const isHidden = getOnStartHiddenStatus(chapter.id, key);
            if (isHidden) {
              updatedOnStart["#" + key] = value;
            } else {
              updatedOnStart[key] = value;
            }
          });
        }

        const choicesJSON = chapter.choices.map((choice) => {
          const requirements: Record<string, number | string> = {};
          const costs: Record<string, number | string> = {};

          if (choice.requirement) {
            Object.entries(choice.requirement).forEach(([requirementId, reqData]) => {
              const finalKey = reqData.isHidden ? "#" + reqData.key : reqData.key;
              if (reqData.isCost) {
                costs[finalKey] = reqData.value;
              } else {
                requirements[finalKey] = reqData.value;
              }
            });
          }

          return {
            text: choice.text,
            targets: [String(choice.target)],
            ...(Object.keys(requirements).length > 0 && { requirement: requirements }),
            ...(Object.keys(costs).length > 0 && { cost: costs }),
          };
        });

        acc[chapter.id] = {
          text: chapter.text,
          choices: choicesJSON,
          on_start: Object.keys(updatedOnStart).length > 0 ? updatedOnStart : undefined,
        };
        return acc;
      }, {} as Record<string, any>),
      game: "game",
      start: chapters.length > 0 ? String(chapters[0].id) : "1",
    };

    const jsonString = JSON.stringify(jsonStructure, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    if (fileName) {
      link.download = fileName;
    } else {
      link.download = "livro_jogo.json";
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  };

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
              choices: chapterData.choices.map((choiceJSON: IChoiceJSON) => ({
                id: uuidv4(),
                target: Number(choiceJSON.targets[0]),
                text: choiceJSON.text,
                requirement: choiceJSON.requirement
                  ? Object.entries(choiceJSON.requirement).reduce(
                    (acc, [reqKey, reqData]) => { // 'reqKey' aqui é a chave original do requisito
                      const newRequirementId = uuidv4();
                      acc[newRequirementId] = {
                        key: reqKey, // Use a chave original como 'key'
                        value: reqData as number | string,
                        isCost: false,
                        isHidden: false,
                        id: newRequirementId, // Se você ainda quiser manter um ID interno
                      };
                      return acc;
                    },
                    {} as Record<string, { key: string; value: number | string; isCost: boolean; isHidden: boolean; id?: string }>
                  )
                  : undefined,
              })),
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
    setOpenDialog(true);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar com capítulos */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          height: "100%", // Preenche a altura
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, mt: 0 }}>
          <Typography variant="h6">Capítulos</Typography>
          <List component={"nav" as any} sx={{ maxHeight: '580px', overflow: 'auto' }} ref={chapterListRef}>
            {chapters.map((ch) => {
              const isSelected = ch.id === selectedChapter?.id;
              return (
                <ListItem key={ch.id} disablePadding>
                  <ListItemButton
                    onClick={() => setSelectedChapter(ch)}
                    selected={isSelected}
                    sx={{
                      bgcolor: isSelected ? "#ddd" : "transparent",
                      "&:hover": { bgcolor: "#ccc" },
                    }}
                  >
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
            <Button variant="contained" fullWidth onClick={handleSaveClick} startIcon={<SaveIcon />}>
              Salvar
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button variant="outlined" fullWidth onClick={clearHistory} startIcon={<AddIcon />}>
              Novo
            </Button>
            <Divider sx={{ my: 2 }} />
            <input
              type="file"
              accept=".json"
              onChange={loadJsonFile}
              style={{ display: "none" }}
              id="load-json-file"
            />
            <label htmlFor="load-json-file">
              <Button variant="outlined" component="span" fullWidth startIcon={<FileUploadIcon />}>
                Carregar
              </Button>
            </label>
          </Box>
        </Box>
      </Drawer>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 3,
        }}
      >
        {selectedChapter ? (
          <>
            <TextField
              label="Capítulo"
              value={selectedChapter.title}
              onChange={(e) => handleChapterChange("title", e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Texto do Capítulo"
              value={selectedChapter.text}
              onChange={(e) => handleChapterChange("text", e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={4}
            />

            {/* Abas */}
            <Tabs value={tabIndex} onChange={(_, newIndex) => setTabIndex(newIndex)} sx={{ mt: 2 }}>
              <Tab label="On Start" />
              <Tab label="Escolhas" />
            </Tabs>

            {/* Aba On Start */}
            {tabIndex === 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      On Start
                    </Typography>
                    {selectedChapter.on_start && (
                        Object.entries(selectedChapter.on_start).map(([key, value], index) => (
                          <Box key={`<span class="math-inline">\{key\}\-</span>{index}`} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <TextField
                              label="Chave On Start"
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
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isOnStartHidden(key)}
                                  onChange={(e) => handleOnStartHiddenChange(key, e.target.checked)}
                                />
                              }
                              label="Ocultar"
                            />
                            <IconButton onClick={() => removeOnStart(key)}>
                                <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                      ))
                    )}
                    <Button variant="outlined" sx={{ mt: 1 }} onClick={addOnStart}>
                        ➕ Adicionar On Start
                    </Button>
                </Box>
            )}
            {/* Aba Escolhas */}
            {tabIndex === 1 && (
              <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                      Escolhas
                  </Typography>
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
                          <AccordionDetails>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1, mt: 1 }}>
                                  <TextField
                                      label="Texto da Escolha"
                                      value={choice.text}
                                      onChange={(e) =>
                                          updateChoice(index, { ...choice, text: e.target.value })
                                      }
                                      fullWidth
                                      sx={{ width: "60%",mr: 1 }}
                                  />
                                  <Autocomplete
                                      options={chapters
                                          .filter((chapter) => chapter.id !== selectedChapter?.id)
                                          .map((chapter) => ({
                                              id: chapter.id,
                                              title: chapter.title,
                                          }))}
                                      getOptionLabel={(option: IChapterOption) => option.title}
                                      value={chapters.find((chapter) => chapter.id === choice.target) || null}
                                      onChange={(_, newValue) => {
                                          updateChoice(index, {
                                              ...choice,
                                              target: newValue ? newValue.id : 0,
                                          });
                                      }}
                                      renderInput={(params) => <TextField {...params} label="Destino" />}
                                      sx={{ width: "40%", mr: 1 }}
                                      filterOptions={(options, params): IChapterOption[] => {
                                          const filtered = filterOptions(options, params);
                                          return params.inputValue.length > 2 ? filtered : [];
                                      }}
                                  />
                                  <IconButton onClick={() => removeChoice(index)}>
                                      <DeleteIcon color="error" />
                                  </IconButton>
                              </Box>
                              {/* Requisitos & Custos */}
                              <Typography variant="subtitle1">Requisitos & Custos</Typography>
                              {choice.requirement && 
                                  Object.entries(choice.requirement).map(([id, req]) => (
                                    <Box key={id} sx={{ display: "flex", alignItems: "center", mb: 1, mt: 1 }}>
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
                                        label="Custo"
                                      />
                                      <FormControlLabel
                                        control={<Checkbox checked={req.isHidden} onChange={(e) => updateRequirement(index, id, req.value, req.isCost, e.target.checked)} />}
                                        label="Ocultar"
                                      />
                                      <IconButton onClick={() => removeRequirementFromChoice(index, id)}> {/* Use o ID para remover */}
                                        <DeleteIcon color="error" />
                                      </IconButton>
                                    </Box>
                                  ))
                              }
                              <Button variant="outlined" onClick={() => addRequirementToChoice(index)}>
                                  ➕ Adicionar Recurso
                              </Button>
                          </AccordionDetails>
                      </Accordion>
                    </Box>
                  ))}
                  <Button variant="outlined" onClick={addChoice} sx={{ mt: 2 }}>
                  ➕ Adicionar Escolha
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
          <Button
            onClick={() => {
              setOpenDialog(false);
              saveJsonFile(loadedFileName || "livro_jogo.json");
            }}
            variant="contained"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookEditor;
