/**
 * @file saveGameData.ts
  * @author Airton Filho
 * @date 29/04/2025
 * @version 1.0
 */

import { useState } from "react";
import { Chapter } from "../Types/Chapter";

/**
 * @module saveGameData
 */

/**
 * Gera um arquivo JSON contendo a estrutura do livro-jogo a partir dos capítulos fornecidos
 * e força o download no navegador do usuário.
 *
 * @param {Chapter[]} chapters - Um array de objetos representando os capítulos do livro-jogo.
 * Cada capítulo deve ter uma estrutura que inclua 'id', 'text', 'choices' (um array de escolhas),
 * e opcionalmente 'on_start' (um objeto com ações ao iniciar o capítulo). Cada escolha deve ter
 * 'text' e 'targets' (um array de IDs de capítulos de destino, com repetições baseadas na probabilidade).
 * @param {string} [fileName='livro_jogo.json'] - O nome do arquivo JSON a ser baixado.
 * Se não fornecido, o nome padrão será 'livro_jogo.json'.
 *
 * @example
 * ```typescript
 * import { saveJsonFile } from './utils/saveGameData';
 * import { chaptersData } from './data/chapters';
 *
 * const handleSave = () => {
 * saveJsonFile(chaptersData, 'minha_aventura.json');
 * };
 * ```
 */
export const saveJsonFile = (
    chapters: Chapter[],
    onStartHiddenStatus: Record<number, Record<string, boolean>>,
    fileName: string = 'livro_jogo.json'
) => {
    const getOnStartHiddenStatusLocal = (chapterId: string | number, key: string): boolean => {
        return onStartHiddenStatus[Number(chapterId)]?.[key] || false;
    };

    const jsonStructure = {
        chapters: chapters.reduce((acc, chapter) => {
            const updatedOnStart: Record<string, number | string> = {};
            if (chapter.on_start) {
                Object.entries(chapter.on_start).forEach(([key, value]) => {
                    const isHidden = getOnStartHiddenStatusLocal(chapter.id, key);
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
                let targetsArray: string[] = [];

                if (choice.targets.length === 1) {
                    targetsArray = [String(choice.targets[0].targetId)];
                } else if (choice.targets.length > 1) {
                    const probabilityMap: Record<string, number> = {};
                    choice.targets.forEach(t => {
                        probabilityMap[String(t.targetId)] = t.probability;
                    });

                    const probabilities = Object.values(probabilityMap);

                    const gcd = (a: number, b: number): number => {
                        return b === 0 ? a : gcd(b, a % b);
                    };

                    let commonDivisor = probabilities[0] || 1;
                    for (let i = 1; i < probabilities.length; i++) {
                        commonDivisor = gcd(commonDivisor, probabilities[i]);
                    }

                    for (const targetId in probabilityMap) {
                        const probability = probabilityMap[targetId];
                        const occurrences = probability / commonDivisor;
                        for (let i = 0; i < occurrences; i++) {
                            targetsArray.push(targetId);
                        }
                    }
                    targetsArray.sort(() => Math.random() - 0.5);
                }

                return {
                    text: choice.text,
                    targets: targetsArray.length > 0 ? targetsArray : undefined,
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

    let jsonString = JSON.stringify(jsonStructure, null, 2);

    // Encontra o array "targets" e remove as quebras de linha e espaços entre os elementos
    jsonString = jsonString.replace(/"targets": \[\n\s*"([^"]+)"(?:,\n\s*"([^"]+)")*\n\s*\]/g, (match) => {
        return match.replace(/\n\s*/g, '');
    });

    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};