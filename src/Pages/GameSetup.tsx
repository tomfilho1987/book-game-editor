/**
 * @file GameSetup.tsx
 * @description Componente para configurar os recursos padrão e as condições do jogo.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */
import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
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
     * @function handleResourceChange
     * @description Atualiza o valor de um recurso padrão na configuração.
     * @param {string} key - A chave do recurso.
     * @param {number} value - O novo valor do recurso.
     */
    const handleResourceChange = (key: string, value: number) => {
        setConfig({
            ...config,
            default_resources: { ...config.default_resources, [key]: value },
        });
    };

    /**
     * @function handleConditionChange
     * @description Atualiza uma condição na configuração.
     * @param {string} key - A chave da condição.
     * @param {number} min - O valor mínimo da condição.
     * @param {string} trigger - O gatilho da condição.
     */
    const handleConditionChange = (key: string, min: number, trigger: string) => {
        setConfig({
            ...config,
            conditions: { ...config.conditions, [key]: { min, trigger } },
        });
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
            <Typography variant="h4" gutterBottom>Configuração do Jogo</Typography>

            <Typography variant="h6" gutterBottom>Recursos Padrão</Typography>
            {Object.entries(config.default_resources).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                        label="Nome do Recurso"
                        value={key}
                        disabled
                        sx={{ mr: 1 }}
                    />
                    <TextField
                        label="Valor Padrão"
                        type="number"
                        value={value}
                        onChange={(e) => handleResourceChange(key, Number(e.target.value))}
                        sx={{ mr: 1 }}
                    />
                </Box>
            ))}
            <Button variant="outlined" onClick={() => handleResourceChange(`recurso${Object.keys(config.default_resources).length + 1}`, 0)}>
                ➕ Adicionar Recurso
            </Button>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Condições</Typography>
            {Object.entries(config.conditions).map(([key, condition]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                        label="Nome da Condição"
                        value={key}
                        disabled
                        sx={{ mr: 1 }}
                    />
                    <TextField
                        label="Valor Mínimo"
                        type="number"
                        value={condition.min}
                        onChange={(e) => handleConditionChange(key, Number(e.target.value), condition.trigger)}
                        sx={{ mr: 1 }}
                    />
                    <TextField
                        label="Gatilho"
                        value={condition.trigger}
                        onChange={(e) => handleConditionChange(key, condition.min, e.target.value)}
                        sx={{ mr: 1 }}
                    />
                </Box>
            ))}
            <Button variant="outlined" onClick={() => handleConditionChange(`condicao${Object.keys(config.conditions).length + 1}`, 0, '')}>
                ➕ Adicionar Condição
            </Button>

            <Box>
                <Button variant="contained" onClick={generateJsonFile} sx={{ mt: 3 }}>
                    📥 Baixar JSON
                </Button>
            </Box>
        </Box>
    );
};

export default GameSetup;