import { api } from '../api.js';

export async function getCourseLearning(courseId) {
  const { data } = await api.get(`/courses/${courseId}/learn`);
  return data;
}

export async function completeLesson(courseId, lessonKey) {
  const { data } = await api.post(`/courses/${courseId}/lessons/${lessonKey}/complete`);
  return data;
}
