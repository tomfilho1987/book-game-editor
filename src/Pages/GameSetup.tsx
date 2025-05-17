import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ICondition, IGameConfig } from '../Interfaces/IGameConfig';

const GameSetup: React.FC = () => {
    const [config, setConfig] = useState<IGameConfig>({
        default_resources: [{ key: '', value: '' }],
        conditions: {}, // Inicializa conditions como um objeto vazio
    });
    const [conditionList, setConditionList] = useState<ICondition[]>([
        { key: '', min: '', trigger: '' },
    ]);

    const handleResourceChange = (index: number, name: 'key' | 'value', value: string) => {
        const updatedResources = [...config.default_resources];
        updatedResources[index] = { ...updatedResources[index], [name]: name === 'value' ? Number(value) : value };
        setConfig({ ...config, default_resources: updatedResources });
    };

    const handleAddResource = () => {
        setConfig({
            ...config,
            default_resources: [...config.default_resources, {}],
        });
    };

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

    const [newCondition, setNewCondition] = useState<{ key: string; min: string; trigger: string }>({ key: '', min: '', trigger: '' });

    const generateJsonFile = () => {
        const resourcesFormatted = config.default_resources.reduce((acc: Record<string, string>, resource) => {
            if (resource && typeof resource.key === 'string' && resource.key.trim() !== '') {
                acc[resource.key.trim()] = resource.value || "";
            }
            return acc;
        }, {});

        const conditionsFormatted = Object.entries(config.conditions).reduce((acc: Record<string, { min: number; trigger: string }>, [key, condition]) => {
            if (condition && key.trim()) {
                acc[key.trim()] = {
                    min: Number(condition.min) || 0, // <-- conversão aqui
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

    useEffect(() => {
        console.log('Estado config atualizado:', JSON.stringify(config.default_resources, null, 2));
    }, [config.default_resources]);

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
        setConfig(prev => ({ ...prev, conditions: conditionsObj }));
    }, [conditionList]);

    return (
        <Box sx={{ p: 3, mt: 1 }}>
            <Typography variant="h6" gutterBottom>Recursos</Typography>
            {config.default_resources.map((resource, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
                <Button variant="contained" onClick={generateJsonFile} sx={{ mt: 3 }}>
                    📥 Baixar JSON
                </Button>
            </Box>
        </Box>
    );
};

export default GameSetup;