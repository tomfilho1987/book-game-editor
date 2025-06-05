/**
 * @interface IChapterDataJSON
 * @description Define a estrutura 'Chapter' do json a ser carregado
 */

import { IChoiceJSON } from "./IChoiceJSON";

export interface IChapterDataJSON {
  choices: IChoiceJSON[];
  text: string;
  image?: string;
  on_start?: Record<string, string | number | { value: string | number; isHidden?: boolean }>;
}