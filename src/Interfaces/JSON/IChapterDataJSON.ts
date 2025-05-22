/**
 * @interface IChapterDataJSON
 * @description Define a estrutura 'Chapter' do json a ser carregado
 */

import { IChoiceJSON } from "./IChoiceJSON";

export interface IChapterDataJSON {
  choices: IChoiceJSON[];  
  text: string;
  on_start?: Record<string, number | string>;
}