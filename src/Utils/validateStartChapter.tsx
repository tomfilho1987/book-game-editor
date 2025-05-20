import { Chapter } from "../Types/Chapter";

/**
 * @function validateStartChapter
 * @description Valida se exatamente um capítulo está marcado como o capítulo inicial.
 * @param {Chapter[]} chapters - Um array de objetos representando os capítulos do livro-jogo.
 * @returns {{ isValid: boolean; message: string }} - Um objeto contendo um booleano indicando se a validação passou e uma mensagem de erro detalhada em caso de falha.
 */
const validateStartChapter = (chapters: Chapter[]): { isValid: boolean; message: string } => {
  const startChapters = chapters.filter(chapter => chapter.isStartChapter);

  if (startChapters.length === 0) {
    return { isValid: false, message: 'Você precisa marcar um capítulo como o Capítulo Inicial.' };
  }

  if (startChapters.length > 1) {
    return { isValid: false, message: 'Apenas um capítulo pode ser marcado como o Capítulo Inicial.' };
  }

  return { isValid: true, message: '' };
};

export default validateStartChapter;