import { Chapter } from "../Types/Chapter";

/**
 * @function validateChoices
 * @description Valida se todas as escolhas em todos os capítulos possuem texto e pelo menos um destino.
 * @param {Chapter[]} chapters - Um array de objetos representando os capítulos do livro-jogo.
 * @returns {{ isValid: boolean; message: string }} - Um objeto contendo um booleano indicando se a validação passou e uma mensagem de erro detalhada em caso de falha.
 */
const validateChoices = (chapters: Chapter[]): { isValid: boolean; message: string } => {
  const invalidChoices: { chapterTitle: string; choiceName?: string; hasNoText?: boolean; hasNoTarget?: boolean }[] = [];

  for (const chapter of chapters) {
    for (const choice of chapter.choices) {
      let isInvalid = false;
      const invalidChoiceInfo: { chapterTitle: string; choiceName?: string; hasNoText?: boolean; hasNoTarget?: boolean } = {
        chapterTitle: chapter.title,
        choiceName: choice.text, // Tenta pegar o nome da escolha
      };

      if (!choice.text || choice.text.trim() === '') {
        invalidChoiceInfo.hasNoText = true;
        isInvalid = true;
      }
      if (!choice.targets || choice.targets.length === 0) {
        invalidChoiceInfo.hasNoTarget = true;
        isInvalid = true;
      }

      if (isInvalid) {
        invalidChoices.push(invalidChoiceInfo);
      }
    }
  }

  if (invalidChoices.length > 0) {
    let errorMessage = "As seguintes escolhas estão incompletas:\n";
    invalidChoices.forEach((invalidChoice, index) => {
      const choiceIdentifier = invalidChoice.choiceName ? `"${invalidChoice.choiceName}"` : "(Sem nome)";
      let details = `- Capítulo: "${invalidChoice.chapterTitle}", Escolha: ${choiceIdentifier}`;
      if (invalidChoice.hasNoText) {
        details += " (Sem texto)";
      }
      if (invalidChoice.hasNoTarget) {
        details += " (Sem destino)";
      }
      errorMessage += (index > 0 ? "\n" : "") + details;
    });
    return { isValid: false, message: errorMessage };
  }

  return { isValid: true, message: '' };
};

export default validateChoices;