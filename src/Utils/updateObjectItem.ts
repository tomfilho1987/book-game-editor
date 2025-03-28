/**
 * @file updateObjectItem.ts
 * @description Funções de utilidade para manipulação de objetos.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */

/**
 * @function updateObjectItem
 * @description Atualiza um item em um objeto, permitindo a mudança da chave.
 * @template T - O tipo dos valores do objeto.
 * @param {Record<string, T>} obj - O objeto a ser atualizado.
 * @param {string} oldKey - A chave antiga do item.
 * @param {string} newKey - A nova chave do item.
 * @param {T} newValue - O novo valor do item.
 * @returns {Record<string, T>} Um novo objeto com o item atualizado.
 */
export const updateObjectItem = <T>(obj: Record<string, T>, oldKey: string, newKey: string, newValue: T): Record<string, T> => {
    const updatedObj: Record<string, T> = {};
    Object.entries(obj).forEach(([key, value]) => {
        if (key === oldKey) {
            updatedObj[newKey] = newValue;
        } else {
            updatedObj[key] = value;
        }
    });
    return updatedObj;
};
