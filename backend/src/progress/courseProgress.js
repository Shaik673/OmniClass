export function lessonCount(modules = []) {
  return modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
}

export function nextLessonProgress(modules, completedLessons) {
  const total = lessonCount(modules);
  const completed = new Set(completedLessons);
  return total ? Math.min(100, Math.round(completed.size * 100 / total)) : 0;
}

export function lessonExists(modules, lessonKey) {
  const match = /^(\d+)\.(\d+)$/.exec(lessonKey);
  return Boolean(match && modules[Number(match[1])]?.lessons?.[Number(match[2])]);
}
