/**
 * @file removeObjectItem.ts
 * @description Funções de utilidade para manipulação de objetos.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */

/**
 * @function removeObjectItem
 * @description Remove um item de um objeto.
 * @template T - O tipo dos valores do objeto.
 * @param {Record<string, T>} obj - O objeto do qual remover o item.
 * @param {string} key - A chave do item a ser removido.
 * @returns {Record<string, T> | undefined} Um novo objeto sem o item removido, ou undefined se o objeto estiver vazio após a remoção.
 */
export const removeObjectItem = <T>(obj: Record<string, T>, key: string): Record<string, T> | undefined => {
    const updatedObj = { ...obj };
    delete updatedObj[key];
    return Object.keys(updatedObj).length > 0 ? updatedObj : undefined;
};