import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography, IconButton, FormControlLabel, Checkbox, Modal, Fade, Backdrop, Grid, Grid2, Divider } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ICondition, IGameConfig, IResource } from '../Interfaces/IGameConfig';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from "@mui/icons-material/UploadFile"; // Ícone para upload
import CustomDialogInformacao from '../Components/CustomDialogInformacao';
import { ICustomDialogAlert } from '../Interfaces/ICustomDialogAlert';
import DownloadIcon from '@mui/icons-material/Download';
import CustomAlertDialog from '../Components/CustomAlertDialog';

/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
const GameSetup: React.FC = () => {
    
    const [dialogInfo, setDialogInfo] = React.useState<ICustomDialogAlert>({ open: false, title: 'Aviso', message: '', param: '' })
    const [dialogAlert, setDialogAlert] = React.useState<ICustomDialogAlert>({ open: false, title: 'Confirma Operação?', message: '', param: '' })

     /**
     * @state config
     * @description Estado principal que armazena a configuração completa do jogo,
     * incluindo recursos padrão e condições.
     */
    const [config, setConfig] = useState<IGameConfig>({
        default_resources: [{ key: '', value: '' }],
        conditions: {},
    });
    /**
     * @state conditionList
     * @description Estado auxiliar para gerenciar a lista de condições na UI,
     * facilitando a manipulação individual antes de serem formatadas
     * no objeto 'conditions' da configuração.
     */
    const [conditionList, setConditionList] = useState<ICondition[]>([
        { key: '', min: '', trigger: '' },
    ]);

    /**
     * @function handleResourceChange
     * @description Atualiza um campo específico de um recurso no estado `config.default_resources`.
     * @param {number} index - O índice do recurso na lista a ser atualizado.
     * @param {'key' | 'value' | 'isHidden'} name - O nome da propriedade do recurso a ser modificada.
     * @param {string | boolean} value - O novo valor da propriedade.
     */
    const handleResourceChange = (index: number, name: 'key' | 'value' | 'isHidden', value: string | boolean) => {
        const updatedResources = [...config.default_resources];
        const currentResource = { ...updatedResources[index] };

        if (name === 'value') {
            currentResource[name] = Number(value); // Converte para número
        } else if (name === 'isHidden') {
            currentResource[name] = value as boolean; // Atribui o booleano diretamente
        } else {
            currentResource[name] = value as string; // Para 'key'
        }

        updatedResources[index] = currentResource;
        setConfig({ ...config, default_resources: updatedResources });
    };

    /**
     * @function handleAddResource
     * @description Adiciona um novo recurso vazio à lista de `default_resources`.
     */
    const handleAddResource = () => {
        setConfig({
            ...config,
            default_resources: [...config.default_resources, { key: '', value: '', isHidden: false }],
        });
    };

    /**
     * @function handleRemoveResource
     * @description Remove um recurso da lista de `default_resources` pelo seu índice.
     * @param {number} index - O índice do recurso a ser removido.
     */
    const handleRemoveResource = (index: number) => {
        const updatedResources = config.default_resources.filter((_, i) => i !== index);
        setConfig({ ...config, default_resources: updatedResources });
    };

    /**
     * @function handleAddCondition
     * @description Adiciona uma condição da configuração.
     */
    const handleAddCondition = () => {
        setConditionList([...conditionList, { key: '', min: '', trigger: '' }]);
    };

    /**
     * @function handleRemoveCondition
     * @description Remove uma condição da configuração.
     * @param {string} key - A chave da condição a ser removida.
     */
    const handleRemoveCondition = (index: number) => {
        const updatedList = conditionList.filter((_, i) => i !== index);
        setConditionList(updatedList);
    };

     /**
     * @function handleConditionFieldChange
     * @description Atualiza o estado da nova condição conforme os campos são preenchidos.
     * @param {number} index - A chave da condição.
     * @param {ICondition} field - O nome da propriedade a ser atualizada.
     * @param {string} value - O novo valor.
     */
    const handleConditionFieldChange = (index: number, field: keyof ICondition, value: string) => {
        const updatedList = [...conditionList];
        updatedList[index] = { ...updatedList[index], [field]: value };
        setConditionList(updatedList);
    };

    /**
     * @function generateJsonFile
     * @description Formata os dados de `default_resources` e `conditions` e gera um arquivo JSON
     * para download. Adiciona '#' ao 'key' do recurso se 'isHidden' for true.
     */
    const generateJsonFile = () => {
        const resourcesFormatted = config.default_resources.reduce((acc: Record<string, string | number>, resource) => {
            // Verifica se a chave existe e não está vazia
            if (resource.key && resource.key.trim() !== '') {
                let resourceKey = resource.key.trim();
                // Adiciona '#' se o recurso estiver marcado como oculto
                if (resource.isHidden) {
                    resourceKey = `#${resourceKey}`;
                }
                acc[resourceKey] = resource.value || ''; // Usa o valor ou uma string vazia
            }
            return acc;
        }, {});

        // Lógica para formatar as condições (mantida do seu código original)
        const conditionsFormatted = conditionList.reduce((acc: Record<string, { min: number; trigger: string }>, condition) => {
            if (condition.key && condition.key.trim()) {
                acc[condition.key.trim()] = {
                    min: Number(condition.min) || 0,
                    trigger: condition.trigger
                };
            }
            return acc;
        }, {});

        const jsonString = JSON.stringify({
            default_resources: resourcesFormatted,
            conditions: conditionsFormatted
        }, null, 2);

        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'game_config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * @useEffect
     * @description Efeito colateral para manter `config.conditions` sincronizado
     * com `conditionList` para uso interno ou depuração.
     * (Se a formatação final é feita apenas no `generateJsonFile`, este `useEffect`
     * pode ser removido ou modificado conforme a necessidade).
     */
    useEffect(() => {
        const conditionsObj: Record<string, ICondition> = {};
        conditionList.forEach(cond => {
            if (cond.key?.trim()) {
                conditionsObj[cond.key.trim()] = {
                    key: cond.key.trim(),
                    min: cond.min,
                    trigger: cond.trigger
                };
            }
        });
    }, [conditionList]);

    /**
     * @function isValidSectionData
     * @description Verifica se um dado (objeto ou array) contém informações significativas.
     * Retorna `false` se o dado for nulo, indefinido, um array vazio ou um objeto vazio.
     * Para outros tipos primitivos (string, number, boolean), considera-os válidos se não forem nulos/indefinidos.
     * @param {any} data - O dado a ser validado. Pode ser um objeto, array, string, number, etc.
     * @returns {boolean} Retorna `true` se o dado contém informações, `false` caso contrário.
     */
    const isValidSectionData = (data: any): boolean => {
        if (data === null || typeof data === 'undefined') {
            return false;
        }

        if (typeof data === 'object') {
            // Se for um array, verifica o tamanho
            if (Array.isArray(data)) {
                return data.length > 0;
            }
            // Se for um objeto, verifica se tem chaves
            return Object.keys(data).length > 0;
        }

        return true;
    };

    /**
     * @function handleFileUpload
     * @description Lida com o upload do arquivo JSON e atualiza o estado.
     */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                debugger
                const result = event.target?.result as string;
                const parsed = JSON.parse(result);

// Validação inicial da estrutura principal
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
                    !('default_resources' in parsed) || !('conditions' in parsed)) {
                    setDialogInfo({
                        ...dialogInfo,
                        open: true,
                        message: 'O arquivo JSON selecionado não está no formato esperado. Ele deve conter as chaves "default_resources" e "conditions" como objetos ou arrays.'
                    });
                    return;
                }

                // Validação unificada para a estrutura e conteúdo das seções principais
                const requiredSections = ['default_resources', 'conditions'];
                let validationMessage = '';

                for (const section of requiredSections) {
                    if (!(section in parsed) || !isValidSectionData(parsed[section])) {
                        validationMessage = `A seção "${section}" no arquivo JSON está ausente, vazia ou mal formatada. Por favor, verifique o conteúdo.`;
                        break; // Sai do loop assim que encontrar a primeira seção inválida
                    }
                }

                if (validationMessage) {
                    setDialogInfo({
                        ...dialogInfo,
                        open: true,
                        message: validationMessage
                    });
                    return;
                }
                
                const resources: IResource[] = Object.entries(parsed.default_resources || {}).map(([key, value]) => {
                    const isHidden = key.startsWith("#") || key.startsWith("@");
                    const cleanedKey = isHidden ? key.substring(1) : key;

                    let parsedValue: string | number = '';

                    if (typeof value === 'number' || typeof value === 'string') {
                        parsedValue = value;
                    } else {
                        console.warn(`Valor inválido para o recurso "${cleanedKey}":`, value);
                        parsedValue = ''; // Ou algum valor padrão
                    }

                    return {
                        key: cleanedKey,
                        value: parsedValue,
                        isHidden
                    };
                });

                const condList: ICondition[] = Object.entries(parsed.conditions || {}).map(([key, cond]) => {
                    if (
                        typeof cond === 'object' &&
                        cond !== null &&
                        'min' in cond &&
                        'trigger' in cond &&
                        (typeof (cond as any).min === 'number' || typeof (cond as any).min === 'string') &&
                        typeof (cond as any).trigger === 'string'
                    ) {
                        return {
                            key,
                            min: (cond as any).min.toString(),
                            trigger: (cond as any).trigger
                        };
                    } else {
                        console.warn(`Condição inválida para a chave "${key}":`, cond);
                        return {
                            key,
                            min: '',
                            trigger: ''
                        };
                    }
                });

                setConfig({
                    default_resources: resources,
                    conditions: parsed.conditions || {}
                });
                setConditionList(condList);
            } catch (err: any) {
                setDialogInfo({ ...dialogInfo, open: true, message: 'Erro ao processar o arquivo JSON. Verifique o formato do arquivo selecionado.' });
            }
        };

        reader.readAsText(file);
    };

    const handleCloseModal = () => {
        setDialogInfo({ ...dialogInfo, open: false, message: '' })
    };

    const confirmationDialog = () => {
        setDialogAlert({ ...dialogAlert, open: true, message: `Deseja realmente limpar a configuração?` });
    }
    
    /**
     * @function handleClearAll
     * @description Limpa todas as informações, resetando os estados `config` e `conditionList`.
     */
    const handleClearAll = () => {
        setConfig({ default_resources: [{ key: '', value: '' }], conditions: {}, });
        setConditionList([ { key: '', min: '', trigger: '' }, ]);
        setDialogAlert({ ...dialogAlert, open: false })
    };

    return (
        <Grid2 container sx={{ minHeight: 1, mt: 2 }}>
            <Grid2 size={2}>
                <Box sx={{ p: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Button variant="contained" fullWidth onClick={generateJsonFile} startIcon={<DownloadIcon />}>
                            Salvar
                        </Button>
                        <Divider sx={{ my: 2 }} />
                        <Button variant="outlined" onClick={confirmationDialog} fullWidth startIcon={<ClearIcon />}>
                            Limpar
                        </Button>
                        <Divider sx={{ my: 2 }} />
                        <Button variant="outlined" style={{ marginTop: "10px", width: "100%" }} component="label" startIcon={<UploadFileIcon />}>
                            Carregar
                            <input type="file" accept=".json" hidden onChange={handleFileUpload} />
                        </Button>
                    </Box>
                </Box>
            </Grid2>
            <Divider orientation="vertical" variant="fullWidth" flexItem/>
            <Grid2 size={"grow"}>
                <Box sx={{ p: 3, mt: 1 }}>
                    <Typography variant="h6" gutterBottom>Recursos</Typography>
                    {config.default_resources.map((resource, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={resource.isHidden || false}
                                        onChange={(e) => handleResourceChange(index, 'isHidden', e.target.checked)} />
                                }
                                label="Oculto?" sx={{ mb: 0.5 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField label="Recurso" value={resource.key || ""} sx={{ mr: 1 }}
                                    onChange={(e) => handleResourceChange(index, 'key', e.target.value)} />
                                <TextField label="Valor" value={resource.value || ""} sx={{ mr: 1 }}
                                    onChange={(e) => handleResourceChange(index, 'value', e.target.value)} />
                                {index === config.default_resources.length - 1 && (
                                    <Button variant="outlined" onClick={handleAddResource} sx={{ mr: 1 }}>
                                        ➕ Adicionar Recurso
                                    </Button>
                                )}
                                {config.default_resources.length > 1 && (
                                    <IconButton onClick={() => handleRemoveResource(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    ))}

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Condições</Typography>
                    {conditionList.map((condition, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TextField label="Condição" value={condition.key} sx={{ mr: 1 }}
                                onChange={(e) => handleConditionFieldChange(index, 'key', e.target.value)} />
                            <TextField label="Valor Mínimo" value={condition.min} sx={{ mr: 1 }}
                                onChange={(e) => handleConditionFieldChange(index, 'min', e.target.value)} />
                            <TextField label="Gatilho" value={condition.trigger} sx={{ mr: 1 }}
                                onChange={(e) => handleConditionFieldChange(index, 'trigger', e.target.value)} />
                            {index === conditionList.length - 1 && (
                                <Button variant="outlined" onClick={handleAddCondition} sx={{ mr: 1 }}>
                                    ➕ Adicionar Condição
                                </Button>
                            )}
                            {conditionList.length > 1 && (
                                <IconButton onClick={() => handleRemoveCondition(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                    <CustomDialogInformacao titulo={dialogInfo.title} abrirModal={dialogInfo.open} handleFechar={handleCloseModal} mensagem={dialogInfo.message} />
                </Box>
            </Grid2>
            <CustomAlertDialog open={dialogAlert.open} title={dialogAlert.title} message={dialogAlert.message} handleClickYes={handleClearAll}
                handleClickNo={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
                handleClickClose={() => { setDialogAlert({ ...dialogAlert, open: false }) }}
            />
        </Grid2>
    );
};

export default GameSetup;