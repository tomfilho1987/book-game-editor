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
    on_start?: OnStartItem[];
    /** Imagem do capítulo. */
    image?: string;
    /** Indica se este é o capítulo inicial. */
    isStartChapter?: boolean;
  };

  /**
 * @type RequirementDetail
 * @description Representa um requisito ou custo associado a uma escolha.
 *              Pode ser visível ou oculto, e consumido ou apenas exigido.
 */
export type OnStartItem = {
  /** ID único e estável (usado como 'key' no React map) */
  id: string;
  /** O nome do recurso/variável (ex: "vida", "energia"). */
  key: string;
  /** O valor associado (ex: "10", "-5"). */
  value: string;
  /** Indica se o item é oculto do jogador. */
  isHidden: boolean;
};