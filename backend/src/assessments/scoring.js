export function gradeAnswers(questions, answers) {
  if (questions.length !== answers.length) throw new RangeError('One answer is required for every question.');
  const review = questions.map((question, index) => ({
    prompt: question.prompt,
    selectedIndex: answers[index],
    correctIndex: question.correctIndex,
    correct: answers[index] === question.correctIndex,
  }));
  const correct = review.reduce((total, item) => total + Number(item.correct), 0);
  return { correct, score: questions.length ? Math.round(correct * 100 / questions.length) : 0, review };
}
