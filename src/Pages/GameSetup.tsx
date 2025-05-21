import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography, IconButton, FormControlLabel, Checkbox } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ICondition, IGameConfig, IResource } from '../Interfaces/IGameConfig';
import SaveIcon from "@mui/icons-material/Save";

/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
const GameSetup: React.FC = () => {
    
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

    return (
        <Box sx={{ p: 3, mt: 1 }}>
            <Typography variant="h6" gutterBottom>Recursos</Typography>
            {config.default_resources.map((resource, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={resource.isHidden || false}
                                onChange={(e) => handleResourceChange(index, 'isHidden', e.target.checked)}
                            />
                        }
                        label="Oculto?"
                        sx={{ mb: 0.5 }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                            label="Recurso"
                            value={resource.key || ""}
                            sx={{ mr: 1 }}
                            onChange={(e) => handleResourceChange(index, 'key', e.target.value)}
                        />
                        <TextField
                            label="Valor"
                            value={resource.value || ""}
                            sx={{ mr: 1 }}
                            onChange={(e) => handleResourceChange(index, 'value', e.target.value)}
                        />
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
                    <TextField
                        label="Condição"
                        value={condition.key}
                        sx={{ mr: 1 }}
                        onChange={(e) => handleConditionFieldChange(index, 'key', e.target.value)}
                    />
                    <TextField
                        label="Valor Mínimo"
                        value={condition.min}
                        sx={{ mr: 1 }}
                        onChange={(e) => handleConditionFieldChange(index, 'min', e.target.value)}
                    />
                    <TextField
                        label="Gatilho"
                        value={condition.trigger}
                        sx={{ mr: 1 }}
                        onChange={(e) => handleConditionFieldChange(index, 'trigger', e.target.value)}
                    />
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
            <Box>
                <Button variant="contained" onClick={generateJsonFile} startIcon={<SaveIcon />} sx={{ mt: 3 }}>
                    Salvar Config
                </Button>
            </Box>
        </Box>
    );
};

export default GameSetup;