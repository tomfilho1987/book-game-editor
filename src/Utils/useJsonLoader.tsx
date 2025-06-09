/**
 * @file useJsonLoader.tsx
 * @description Componente responsável pelo download do arquivo
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 1.0
 */

import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chapter, OnStartItem } from '../Types/Chapter';
import { IGameConfig, IResource } from '../Interfaces/IGameConfig';
import { IChapterDataJSON } from '../Interfaces/JSON/IChapterDataJSON';
import { IChoiceJSON } from '../Interfaces/JSON/IChoiceJSON';
import { Choice, RequirementDetail } from '../Types/Choice';

interface UseJsonLoaderResult {
    loadJsonFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isErrorModalOpen: boolean;
    errorModalMessage: string;
    closeErrorModal: () => void;
}

/*** Props que o hook customizado precisa para retornar os dados para o componente pai */
interface UseJsonLoaderProps {
    setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
    setSelectedChapter: React.Dispatch<React.SetStateAction<Chapter | null>>;
    setLoadedFileName: React.Dispatch<React.SetStateAction<string | null>>;
    setConfig: React.Dispatch<React.SetStateAction<Array<IGameConfig>>>;
}

export const useJsonLoader = ({ setChapters, setSelectedChapter, setLoadedFileName, setConfig }: UseJsonLoaderProps): UseJsonLoaderResult => {
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');

    const closeErrorModal = useCallback(() => {
        setIsErrorModalOpen(false);
        setErrorModalMessage('');
    }, []);

    const normalizeOnStartData = (rawOnStartJson: Record<string, string | number | { value: string | number; isHidden?: boolean }> | undefined): OnStartItem[] => {
        const normalizedArray: OnStartItem[] = [];

        if (rawOnStartJson) {
            Object.entries(rawOnStartJson).forEach(([key, rawValue]) => {
                let isHidden = false;
                let resourceKey = key.trim(); // Esta será a OnStartItem.key

                // Determina isHidden com base no prefixo, e limpa a chave
                if (resourceKey.startsWith('#') || resourceKey.startsWith('@')) {
                    isHidden = true;
                    resourceKey = resourceKey.substring(1);
                }
                
                let finalValue: string;

                // Lógica de validação e conversão do valor para string
                if (typeof rawValue === 'number' || typeof rawValue === 'string') {
                    finalValue = String(rawValue);
                } else if (typeof rawValue === 'object' && rawValue !== null) {
                    if ('isHidden' in rawValue && typeof rawValue.isHidden === 'boolean') {
                        isHidden = rawValue.isHidden;
                    }
                    if ('value' in rawValue && (typeof rawValue.value === 'string' || typeof rawValue.value === 'number')) {
                        finalValue = String(rawValue.value);
                    } else {
                        console.warn(`[normalizeOnStartData] Gatilho '${key}' dentro do objeto tem um valor inesperado para 'value': '${rawValue.value}'. Convertido para string vazia.`);
                        finalValue = '';
                    }
                } else {
                    console.warn(`[normalizeOnStartData] Gatilho '${key}' tem um valor inesperado: '${rawValue}'. Convertido para string vazia.`);
                    finalValue = '';
                }

                if (resourceKey) { // Garante que a chave não é vazia após limpeza
                    normalizedArray.push({
                        id: uuidv4(), // <-- GERE UM ID ÚNICO AQUI!
                        key: resourceKey, // <-- A CHAVE DO RECURSO
                        value: finalValue,
                        isHidden: isHidden,
                    });
                }
            });
        }

        console.log("[normalizeOnStartData] normalized ON_START final:", normalizedArray);
        return normalizedArray;
    };

    const loadJsonFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);

                if (!jsonData || typeof jsonData.chapters !== 'object') {
                    throw new Error("Formato inválido: objeto 'chapters' não encontrado ou mal formatado.");
                }

                const rawStartChapterKey = jsonData.start;

                const chapterIdMap = new Map<string | number, number>();
                let nextNumericId = 1;

                Object.keys(jsonData.chapters).forEach(jsonId => {
                    const numericId = Number(jsonId);
                    if (!isNaN(numericId)) {
                        chapterIdMap.set(jsonId, numericId);
                        if (numericId >= nextNumericId) {
                            nextNumericId = numericId + 1;
                        }
                    } else {
                        chapterIdMap.set(jsonId, nextNumericId);
                        nextNumericId++;
                    }
                });

                const startChapterId = chapterIdMap.get(rawStartChapterKey);
                if (startChapterId === undefined) {
                    console.warn(`Capítulo inicial '${rawStartChapterKey}' não encontrado no JSON. O primeiro capítulo carregado será marcado como inicial.`);
                }

                const loadedDefaultResources: IResource[] = [];
                if (jsonData.default_resources && typeof jsonData.default_resources === 'object') {
                    Object.entries(jsonData.default_resources).forEach(([key, value]) => {
                        let isHidden = false;
                        let cleanedKey = key;

                        if (key.startsWith('#') || key.startsWith('@')) {
                            isHidden = true;
                            cleanedKey = key.substring(1);
                        }

                        loadedDefaultResources.push({
                            key: cleanedKey,
                            value: Number(value),
                            isHidden: isHidden,
                        });
                    });
                }

                const loadedChapters = Object.entries(jsonData.chapters).map(([jsonId, chapterDataUnknown]) => {
                    const chapterData = chapterDataUnknown as IChapterDataJSON;
                    const chapterInternalId = chapterIdMap.get(jsonId);

                    if (chapterInternalId === undefined) {
                        setErrorModalMessage(`Erro de mapeamento: O ID do capítulo '${jsonId}' não pôde ser mapeado para um ID numérico interno. O arquivo pode estar mal formatado.`);
                        setIsErrorModalOpen(true);
                        throw new Error("Erro de mapeamento de capítulo.");
                    }

                    // Quebra de linha
                    chapterData.text = chapterData.text.replace(/\\n/g, '\n');

                    const choices = Array.isArray(chapterData.choices)
                        ? chapterData.choices.map((choiceJSON: IChoiceJSON) => {
                            const rawTargets = choiceJSON.targets ?? [];

                            let normalizedTargets: { targetId: number; probability: number }[] = [];

                            if (rawTargets.length > 0) {
                                if (typeof rawTargets[0] === "object" && "targetId" in rawTargets[0]) {
                                    normalizedTargets = (rawTargets as { targetId: unknown; probability: unknown }[])
                                        .map(t => {
                                            const mappedTargetId = chapterIdMap.get(String(t.targetId));
                                            return {
                                                targetId: mappedTargetId !== undefined ? mappedTargetId : -1,
                                                probability: Number(t.probability),
                                            };
                                        })
                                        .filter(t => t.targetId !== -1);
                                } else {
                                    normalizedTargets = (rawTargets as (string | number)[])
                                        .map(rawTarget => {
                                            const mappedTargetId = chapterIdMap.get(String(rawTarget));
                                            return {
                                                targetId: mappedTargetId !== undefined ? mappedTargetId : -1,
                                                probability: 100 / rawTargets.length,
                                            };
                                        })
                                        .filter(t => t.targetId !== -1);
                                }
                            }

                            let combinedRequirements: Record<string, RequirementDetail> = {};

                            if (choiceJSON.requirement) {
                                Object.entries(choiceJSON.requirement).forEach(([reqKey, reqValue]) => {
                                    let isHiddenRequirement = false;
                                    let cleanedReqKey = reqKey;

                                    if (reqKey.startsWith('#') || reqKey.startsWith('@')) {
                                        isHiddenRequirement = true;
                                        cleanedReqKey = reqKey.substring(1);
                                    }

                                    const newRequirementId = uuidv4();
                                    combinedRequirements[newRequirementId] = {
                                        key: cleanedReqKey,
                                        value: reqValue as number | string,
                                        isCost: false,
                                        isHidden: isHiddenRequirement,
                                        id: newRequirementId,
                                    };
                                });
                            }

                            if (choiceJSON.cost) {
                                Object.entries(choiceJSON.cost).forEach(([costKey, costValue]) => {
                                    let isHiddenCost = false;
                                    let cleanedCostKey = costKey;

                                    if (costKey.startsWith('#') || costKey.startsWith('@')) {
                                        isHiddenCost = true;
                                        cleanedCostKey = costKey.substring(1);
                                    }

                                    const newCostId = uuidv4();
                                    combinedRequirements[newCostId] = {
                                        key: cleanedCostKey,
                                        value: costValue as number | string,
                                        isCost: true,
                                        isHidden: isHiddenCost,
                                        id: newCostId,
                                    };
                                });
                            }

                            return {
                                id: uuidv4(),
                                text: choiceJSON.text || "",
                                targets: normalizedTargets,
                                requirement: Object.keys(combinedRequirements).length > 0 ? combinedRequirements : undefined,
                            } as Choice; // Explicitamente informa ao TypeScript que o objeto é do tipo Choice
                        })
                        : [];

                    const formattedTitle = (Number(jsonId) && !isNaN(Number(jsonId))) ? `Cap ${jsonId}` : jsonId;

                    const processedOnStart = normalizeOnStartData(chapterData.on_start); // <-- Isso agora retorna um array
                    return {
                        id: chapterInternalId,
                        title: formattedTitle,
                        text: chapterData.text || "",
                        image: chapterData.image || "",
                        choices,
                        on_start: processedOnStart,
                        isStartChapter: false,
                    } as Chapter; // Explicitamente informa ao TypeScript que o objeto é do tipo Chapter
                }).filter((chapter): chapter is Chapter => chapter !== null);

                const chaptersWithStartFlag = loadedChapters.map(chapter => {
                    if (chapter.id === startChapterId) {
                        return { ...chapter, isStartChapter: true };
                    }
                    return chapter;
                });

                setConfig(prevConfig => ({
                    ...prevConfig,
                    default_resources: loadedDefaultResources,
                }));
                setChapters(chaptersWithStartFlag);
                setSelectedChapter(chaptersWithStartFlag.find(c => c.id === startChapterId) || (chaptersWithStartFlag.length > 0 ? chaptersWithStartFlag[0] : null));
                setLoadedFileName(file.name);

            } catch (error: any) {
                let errorMessage = "Ocorreu um erro desconhecido ao carregar o arquivo.";
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
                    errorMessage = error.message;
                }
                setErrorModalMessage(`Erro ao processar JSON: ${errorMessage}`);
                setIsErrorModalOpen(true);
            }
        };

        reader.readAsText(file);
    }, [setChapters, setSelectedChapter, setLoadedFileName, setConfig]);

    return {
        loadJsonFile,
        isErrorModalOpen,
        errorModalMessage,
        closeErrorModal,
    };
};