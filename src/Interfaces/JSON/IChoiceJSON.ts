/**
 * @interface IChoiceJSON
 * @description Define a estrutura 'Choice' do json a ser carregado
 */

export interface IChoiceJSON {
    targets: string[];
    text: string;
    requirement?: Record<string, number | string>;
  }