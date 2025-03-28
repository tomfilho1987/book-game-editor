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
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from '@mui/icons-material/FileUpload';

import { Chapter } from "../Types/Chapter";
import { Choice } from "../Types/Choice";
import { IChapterOption } from "../Interfaces/IChapterOption";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IChoiceJSON } from "../Interfaces/JSON/IChoiceJSON ";
import { IChapterDataJSON } from "../Interfaces/JSON/IChapterDataJSON ";

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
  /** Estado para indicar se a opção de sobrescrever foi selecionada. */
  const [overwriteOption, setOverwriteOption] = useState(false);

  const chapterListRef = useRef<HTMLDivElement>(null);

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
    const newChoice: Choice & { expanded: boolean } = {
        target: 0,
        text: "",
        expanded: true, // Inicializa o accordion como expandido
    };
    handleChapterChange("choices", [...selectedChapter.choices, newChoice]);
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
    handleChapterChange("choices", updatedChoices);
  };

  /**
   * @function addRequirementToChoice
   * @description Adiciona um novo requisito/custo à escolha especificada.
   * @param {number} index - O índice da escolha à qual adicionar o requisito/custo.
   */
  const addRequirementToChoice = (index: number) => {
    if (!selectedChapter) return;
    const choice = selectedChapter.choices[index];
    const newReq = { ...choice.requirement, "": { value: 1, isCost: false } };
    updateChoice(index, { ...choice, requirement: newReq });
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
    keyName: string,
    newKey: string | null,
    newValue: number | string,
    isCost: boolean
  ) => {
    const choice = selectedChapter?.choices[choiceIndex];
    if (!choice || !choice.requirement) return;

    const updatedReq: Record<string, { value: number | string; isCost: boolean }> = {};

    Object.entries(choice.requirement).forEach(([key, req]) => {
      if (key === keyName && newKey) {
        updatedReq[newKey] = { value: newValue, isCost };
      } else {
        updatedReq[key] = req;
      }
    });

    updateChoice(choiceIndex, { ...choice, requirement: updatedReq });
  };

  /**
   * @function removeRequirementFromChoice
   * @description Remove um requisito/custo da escolha especificada.
   * @param {number} choiceIndex - O índice da escolha.
   * @param {string} key - A chave do requisito/custo a ser removido.
   */
  const removeRequirementFromChoice = (choiceIndex: number, key: string) => {
    const choice = selectedChapter?.choices[choiceIndex];
    if (!choice || !choice.requirement) return;
    const updatedReq = { ...choice.requirement };
    delete updatedReq[key];
    updateChoice(choiceIndex, { ...choice, requirement: Object.keys(updatedReq).length > 0 ? updatedReq : undefined });
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
        acc[chapter.id] = {
          text: chapter.text,
          choices: chapter.choices.map((choice) => ({
            text: choice.text,
            targets: [String(choice.target)],
            requirement: choice.requirement
              ? Object.entries(choice.requirement).reduce((reqAcc, [key, value]) => {
                  reqAcc[key] = value.value;
                  return reqAcc;
                }, {} as Record<string, number | string>)
              : undefined,
          })),
          on_start: chapter.on_start,
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
      // Sobrescrever arquivo existente
      link.download = fileName;
    } else {
      // Salvar como um novo arquivo
      link.download = "livro_jogo.json"; // Nome padrão
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * @function generateJsonFile
   * @description Gera e baixa o arquivo JSON com os dados dos capítulos.
   * Exibe um diálogo com opções de sobrescrever ou salvar como se um arquivo foi carregado.
   */
  const generateJsonFile = () => {
    if (loadedFileName) {
      setOpenDialog(true);
    } else {
      saveJsonFile();
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
                target: Number(choiceJSON.targets[0]),
                text: choiceJSON.text,
                requirement: choiceJSON.requirement
                  ? Object.entries(choiceJSON.requirement).reduce(
                      (acc, [key, value]) => ({
                        ...acc,
                        [key]: { value, isCost: false }, // Assumindo isCost como false por padrão
                      }),
                      {} as Record<string, { value: number | string; isCost: boolean }>
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
          <List component={"nav" as any} sx={{ maxHeight: '640px', overflow: 'auto' }} ref={chapterListRef}>
            {chapters.map((ch) => {
              const isSelected = ch.id === selectedChapter?.id;
              return (
                <ListItem key={ch.id} disablePadding>
                  <ListItemButton
                    onClick={() => setSelectedChapter(ch)}
                    selected={isSelected} // Define o item como "selecionado"
                    sx={{
                      bgcolor: isSelected ? "#ddd" : "transparent", // Cor de fundo ao selecionar
                      "&:hover": { bgcolor: "#ccc" }, // Melhora o hover
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

            {/* Conteúdo das Abas */}
            {tabIndex === 0 && (
                /* Seção para múltiplos "on_start" */
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6">On Start</Typography>
                    {selectedChapter.on_start && (
                        Object.entries(selectedChapter.on_start).map(([key, value], index) => (
                          <Box key={`<span class="math-inline">\{key\}\-</span>{index}`} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <TextField
                                label="Chave On Start"
                                value={key}
                                onChange={(e) => updateOnStart(key, e.target.value, value)}
                                sx={{ mr: 1, width: "300px" }}
                            />
                            <TextField
                                label="Valor"
                                value={value}
                                onChange={(e) => updateOnStart(key, key, e.target.value)}
                                sx={{ mr: 1 }}
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
            {tabIndex === 1 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mt: 3 }}>
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
                                    Object.entries(choice.requirement).map(([key, req]) => (
                                        <Box key={key} sx={{ display: "flex", alignItems: "center", mb: 1, mt: 1 }}>
                                            <TextField
                                                label="Recurso"
                                                value={key}
                                                sx={{ width: "300px", mr: 1 }}
                                                onChange={(e) => updateRequirement(index, key, e.target.value, req.value, req.isCost)}
                                            />
                                            <TextField
                                                label="Valor"
                                                value={req.value}
                                                sx={{ width: "100px", mr: 1 }}
                                                onChange={(e) => updateRequirement(index, key, key, e.target.value, req.isCost)}
                                            />
                                            <FormControlLabel
                                                control={<Checkbox checked={req.isCost} onChange={(e) => updateRequirement(index, key, key, req.value, e.target.checked)} />}
                                                label="Custo" />
                                            <IconButton onClick={() => removeRequirementFromChoice(index, key)}>
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
