/**
 * @file saveGameData.ts
 * @author Airton Filho
 * @date 10/05/2025
 * @version 9.0
 */

import { Chapter, OnStartItem } from "../Types/Chapter";
import { denormalizeOnStartDataForDownload } from "./denormalizeOnStartDataForDownload ";

/**
 * @module saveGameData
 */

/**
 * Gera um arquivo JSON contendo a estrutura do livro-jogo a partir dos capítulos fornecidos
 * e força o download no navegador do usuário. Utiliza o título do capítulo como referência nos targets
 * e inclui a propriedade 'image' de cada capítulo, com valor vazio caso não esteja definida.
 * As propriedades dentro de cada capítulo são ordenadas como: 'choices' (com 'targets' e 'text' primeiro, seguido por 'cost' e 'requirement'),
 * 'image', 'text' (do capítulo) e 'on_start'.
 *
 * @param {Chapter[]} chapters - Um array de objetos representando os capítulos do livro-jogo.
 * Cada capítulo deve ter uma estrutura que inclua 'id', 'title', 'text', 'choices' (um array de escolhas),
 * opcionalmente 'on_start' (um objeto com ações ao iniciar o capítulo) e opcionalmente 'image' (string com o caminho da imagem).
 * Cada escolha tem 'id', 'targets', 'text' e opcionalmente 'requirement' (com informações de custo e requisito).
 * @param {Record<number, Record<string, boolean>>} onStartHiddenStatus - Um objeto que mapeia o ID do capítulo
 * para um objeto contendo o status de visibilidade de cada chave em 'on_start'.
 * @param {string} [fileName='livro_jogo.json'] - O nome do arquivo JSON a ser baixado.
 * Se não fornecido, o nome padrão será 'livro_jogo.json'.
 *
 * @example
 * ```typescript
 * import { saveJsonFile } from './utils/saveGameData';
 * import { chaptersData } from './data/chapters';
 *
 * const handleSave = () => {
 * saveJsonFile(chaptersData, onStartHiddenStatus, 'minha_aventura.json');
 * };
 * ```
 */
export const saveJsonFile = (
    chapters: Chapter[],
    fileName: string = 'livro_jogo.json'
) => {
    const getChapterTitleById = (chapterId: number): string | undefined => {
        return chapters.find(c => c.id === chapterId)?.title;
    };

    const jsonStructure = {
        chapters: chapters.reduce((acc, chapter) => {
            const denormalizedOnStart = denormalizeOnStartDataForDownload(chapter.on_start);
           
            // const updatedOnStart: Record<string, number | OnStartItem> = {};
            // if (chapter.on_start) {
            //     Object.entries(chapter.on_start).forEach(([key, value]) => {
            //         const isHidden = getOnStartHiddenStatusLocal(chapter.id, key);
            //         if (isHidden) {
            //             updatedOnStart["#" + key] = value;
            //         } else {
            //             updatedOnStart[key] = value;
            //         }
            //     });
            // }

            const choicesJSON = chapter.choices.map((choice) => {
                const requirementsObject: Record<string, any> = {};
                const costsObject: Record<string, any> = {};

                if (choice.requirement) {
                    Object.values(choice.requirement).forEach(req => {
                        const isHidden = req.isHidden === true;
                        const key = isHidden ? `#${req.key}` : req.key;
                        const numericValue = Number(req.value);
                        const value = isNaN(numericValue) ? req.value : numericValue;

                        if (req.isCost) {
                            costsObject[key] = value;
                        } else {
                            requirementsObject[key] = value;
                        }
                    });
                }

                const orderedChoice: any = {
                    targets: choice.targets.length === 0 ? [""] : (choice.targets.length === 1 ? [getChapterTitleById(choice.targets[0].targetId)] : (() => {
                        const probabilityMap: Record<string, number> = {};
                        choice.targets.forEach(t => {
                            const targetTitle = getChapterTitleById(t.targetId);
                            if (targetTitle) {
                                probabilityMap[targetTitle] = t.probability;
                            }
                        });

                        const probabilities = Object.values(probabilityMap);
                        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
                        let commonDivisor = probabilities[0] || 1;
                        for (let i = 1; i < probabilities.length; i++) {
                            commonDivisor = gcd(commonDivisor, probabilities[i]);
                        }

                        const targetsArray: string[] = [];
                        for (const targetTitle in probabilityMap) {
                            const probability = probabilityMap[targetTitle];
                            const occurrences = probability / commonDivisor;
                            for (let i = 0; i < occurrences; i++) {
                                targetsArray.push(targetTitle);
                            }
                        }
                        targetsArray.sort(() => Math.random() - 0.5);
                        return targetsArray;
                    })()),
                    text: choice.text,
                    ...(Object.keys(costsObject).length > 0 && { cost: costsObject }),
                    ...(Object.keys(requirementsObject).length > 0 && { requirement: requirementsObject }),
                };
                return orderedChoice;
            });

            const orderedChapter = {
                choices: choicesJSON,
                image: chapter.image || "",
                text: chapter.text,
                ...(Object.keys(denormalizedOnStart).length > 0 && { on_start: denormalizedOnStart }),
            };

            acc[chapter.title] = orderedChapter;
            return acc;
        }, {} as Record<string, any>),
        game: "game",
        start: chapters.find(c => c.isStartChapter)?.title || "start", // Define o 'start' do jogo pelo capítulo marcado
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