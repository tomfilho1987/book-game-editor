/**
 * @interface IChoiceJSON
 * @description Define a estrutura 'Choice' do json a ser carregado
 */

export interface IChoiceJSON {
    targets: { targetId: number; probability: number }[]; // Array de objetos com ID e probabilidade
    text: string;
    requirement?: Record<string, number | string>;
  }