/**
 * @interface Choice
 * @description Define a estrutura de uma escolha em um capítulo.
 */
export type Choice = {
    /**  Adicione o campo id */
    id: string; 
    /** O ID do capítulo de destino da escolha. */
    target: number;
    /** O texto da escolha. */
    text: string;
    /** Requisitos ou custos associados à escolha. */
    requirement?: Record<string, { key: string, value: number | string; isCost: boolean, isHidden: boolean }>;
    /** Um booleano opcional que indica se o Accordion da escolha está expandido (true) ou recolhido (false) */
    expanded?: boolean;
  };