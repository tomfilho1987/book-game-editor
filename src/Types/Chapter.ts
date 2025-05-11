/**
 * @interface Chapter
 * @description Define a estrutura de um capítulo do livro-jogo.
 */
import { Choice } from "./Choice";

export type Chapter = {
    /** O ID único do capítulo. */
    id: number;
    /** O título do capítulo. */
    title: string;
    /** O texto do capítulo. */
    text: string;
    /** As escolhas disponíveis no capítulo. */
    choices: Choice[];
    /** Ações a serem executadas ao iniciar o capítulo. */
    on_start?: Record<string, number | string>;
    /** Imagem do capítulo. */
    image?: string;
  };