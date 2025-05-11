/**
 * @file validarProbabilidades.ts
 * @author Airton Filho
 * @date 11/05/2025
 * @version 9.0
 */

import { Chapter } from "../Types/Chapter";

/**
 * Valida se a soma das probabilidades das escolhas com múltiplos destinos é igual a 100.
 *
 * @param {Chapter[]} chapters - Um array de objetos representando os capítulos do livro-jogo.
 * @returns {boolean} - Retorna true se todas as escolhas com múltiplos destinos têm probabilidade total de 100, false caso contrário.
 */
export const validarProbabilidades = (chapters: Chapter[]): true | string => {
    for (const chapter of chapters) {
        for (const choice of chapter.choices) {
            if (choice.targets.length > 1) {
                const totalProbability = choice.targets.reduce((sum, target) => sum + target.probability, 0);
                if (totalProbability !== 100) {
                    return `Erro de probabilidade no capítulo "${chapter.title}", escolha "${choice.text}". A soma das probabilidades é ${totalProbability}%, deveria ser 100%.`;
                }
            }
        }
    }
    
    return true;
};