/**
 * @file GameSetup.tsx
 * @description Componente para configurar os recursos padrão e as condições do jogo.
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 4.0 (adição de recurso com campos sempre visíveis)
 */
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { IGameConfig } from '../Interfaces/IGameConfig';

/**
 * @function GameSetup
 * @description Componente para configurar os recursos padrão e as condições do jogo e gerar um arquivo JSON.
 * @returns {JSX.Element} Elemento JSX contendo o formulário de configuração do jogo e o botão para gerar o JSON.
 */
const GameSetup: React.FC = () => {
    /**
     * @state config
     * @description Estado para armazenar a configuração do jogo.
     */
    const [config, setConfig] = useState<IGameConfig>({
        default_resources: {},
        conditions: {},
    });

    /**
     * @state newResource
     * @description Estado para armazenar os dados do novo recurso a ser adicionado.
     */
    const [newResource, setNewResource] = useState<{ key: string; value: string }>({ key: '', value: "" });

    /**
     * @state newCondition
     * @description Estado para armazenar os dados da nova condição a ser adicionada.
     */
    const [newCondition, setNewCondition] = useState<{ key: string; min: string; trigger: string }>({ key: '', min: '', trigger: '' });

    /**
     * @function handleResourceValueChange
     * @description Atualiza o valor de um recurso padrão na configuração.
     * @param {string} key - A chave do recurso.
     * @param {number} value - O novo valor do recurso.
     */
    const handleResourceValueChange = (key: string, value: string) => {
        setConfig({
            ...config,
            default_resources: { ...config.default_resources, [key]: value },
        });
    };

    /**
     * @function handleResourceKeyChange
     * @description Atualiza a chave de um recurso padrão na configuração.
     * @param {string} oldKey - A chave antiga do recurso.
     * @param {string} newKey - A nova chave do recurso.
     */
    const handleResourceKeyChange = (oldKey: string, newKey: string) => {
        const { [oldKey]: value, ...restResources } = config.default_resources;
        if (newKey.trim() && !restResources.hasOwnProperty(newKey.trim())) {
            setConfig({
                ...config,
                default_resources: { ...restResources, [newKey.trim()]: value },
            });
        }
    };

    /**
     * @function handleRemoveResource
     * @description Remove um recurso da configuração.
     * @param {string} key - A chave do recurso a ser removido.
     */
    const handleRemoveResource = (key: string) => {
        const { [key]: removedKey, ...restResources } = config.default_resources;
        setConfig({
            ...config,
            default_resources: restResources,
        });
    };

    /**
     * @function handleNewResourceChange
     * @description Atualiza o estado do novo recurso conforme os campos são preenchidos.
     * @param {React.ChangeEvent<HTMLInputElement>} event - O evento de mudança do input.
     */
    const handleNewResourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setNewResource({ ...newResource, [name]: name === 'value' ? Number(value) : value });
    };

    /**
     * @function handleAddNewResource
     * @description Adiciona o novo recurso à configuração.
     */
    const handleAddNewResource = () => {
        if (newResource.key.trim() && !config.default_resources.hasOwnProperty(newResource.key.trim())) {
            setConfig({
                ...config,
                default_resources: { ...config.default_resources, [newResource.key.trim()]: newResource.value },
            });
            setNewResource({ key: '', value: '' });
        }
    };

    /**
     * @function handleConditionChange
     * @description Atualiza uma condição na configuração.
     * @param {string} key - A chave da condição.
     * @param {number} min - O valor mínimo da condição.
     * @param {string} trigger - O gatilho da condição.
     */
    const handleConditionChange = (key: string, min: string, trigger: string) => {
        setConfig({
            ...config,
            conditions: { ...config.conditions, [key]: { min, trigger } },
        });
    };

    /**
     * @function handleRemoveCondition
     * @description Remove uma condição da configuração.
     * @param {string} key - A chave da condição a ser removida.
     */
    const handleRemoveCondition = (key: string) => {
        const { [key]: removedKey, ...restConditions } = config.conditions;
        setConfig({
            ...config,
            conditions: restConditions,
        });
    };

    /**
     * @function handleNewConditionChange
     * @description Atualiza o estado da nova condição conforme os campos são preenchidos.
     * @param {React.ChangeEvent<HTMLInputElement>} event - O evento de mudança do input.
     */
    const handleNewConditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setNewCondition({
            ...newCondition,
            [name]: name === 'min' ? Number(value) : value,
        });
    };

    /**
     * @function handleAddNewCondition
     * @description Adiciona a nova condição à configuração.
     */
    const handleAddNewCondition = () => {
        if (newCondition.key.trim() && !config.conditions.hasOwnProperty(newCondition.key.trim())) {
            setConfig({
                ...config,
                conditions: { ...config.conditions, [newCondition.key.trim()]: { min: newCondition.min, trigger: newCondition.trigger } },
            });
            setNewCondition({ key: '', min: '0', trigger: '' });
        }
    };

    /**
     * @function generateJsonFile
     * @description Gera e inicia o download de um arquivo JSON com a configuração do jogo.
     */
    const generateJsonFile = () => {
        const jsonString = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'game_config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recursos</Typography>
            {Object.entries(config.default_resources).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField label="Recurso" value={key} sx={{ mr: 1 }}
                        onChange={(e) => handleResourceKeyChange(key, e.target.value)} />
                    <TextField label="Valor" value={value} sx={{ mr: 1 }}
                        onChange={(e) => handleResourceValueChange(key, e.target.value)} />
                    <IconButton onClick={() => handleRemoveResource(key)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField label="Recurso" name="key" value={newResource.key} sx={{ mr: 1 }}
                    onChange={handleNewResourceChange} />
                <TextField label="Valor" name="value" value={newResource.value} sx={{ mr: 1 }}
                    onChange={handleNewResourceChange} />
                <Button variant="outlined" onClick={handleAddNewResource}>
                    ➕ Adicionar Recurso
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Condições</Typography>
            {Object.entries(config.conditions).map(([key, condition]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField label="Condição" value={key} disabled sx={{ mr: 1 }} />
                    <TextField label="Valor Mínimo" value={condition.min} sx={{ mr: 1 }}
                        onChange={(e) => handleConditionChange(key, e.target.value, condition.trigger)} />
                    <TextField label="Gatilho" value={condition.trigger} sx={{ mr: 1 }}
                        onChange={(e) => handleConditionChange(key, condition.min, e.target.value)} />
                    <IconButton onClick={() => handleRemoveCondition(key)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ))}
            <Box sx={{ mb: 1 }}>
                <TextField label="Condição" name="key" sx={{ mr: 1 }}
                    value={newCondition.key} onChange={handleNewConditionChange} />
                <TextField label="Valor Mínimo" name="min" sx={{ mr: 1 }}
                    value={newCondition.min} onChange={handleNewConditionChange} />
                <TextField label="Gatilho" name="trigger" sx={{ mr: 1 }}
                    value={newCondition.trigger} onChange={handleNewConditionChange} />
                <Button variant="outlined" onClick={handleAddNewCondition}>
                    ➕ Adicionar Condição
                </Button>
            </Box>
            <Box>
                <Button variant="contained" onClick={generateJsonFile} sx={{ mt: 3 }}>
                    📥 Baixar JSON
                </Button>
            </Box>
        </Box>
    );
};

export default GameSetup;