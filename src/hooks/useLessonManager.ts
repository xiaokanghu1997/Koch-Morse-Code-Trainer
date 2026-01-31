import { useMemo } from "react";
import { generateLessons } from "../lib/lesson";
import { CHARACTER_SET } from "../lib/constants";
import type { Lesson } from "../lib/types";
import { log } from "../utils/logger";

export interface UseLessonManagerReturn {
  /** 当前数据集的所有课程 */
  lessons: Lesson[];
  /** 当前课程信息 */
  currentLesson: Lesson;
  /** 总课程数 */
  totalLessonNumber: number;
}

/**
 * 课程管理 Hook
 * 
 * 功能：
 * - 获取当前训练集的课程列表信息
 * - 获取当前课程的相关信息
 */
export function useLessonManager(datasetName: string, currentLessonNumber: number): UseLessonManagerReturn {
  /** 获取当前训练集的字符集 */
  const characterSet = CHARACTER_SET[datasetName as keyof typeof CHARACTER_SET];
  if (!characterSet) {
    log.error(`Unknown training dataset: ${datasetName}`, "LessonManager");
    return {
      lessons: [],
      currentLesson: { lessonNumber: 0, characters: [], displayText: "" },
      totalLessonNumber: 0,
    };
  }

  /** 生成课程列表（使用 useMemo 缓存） */
  const lessons = useMemo(() => generateLessons(characterSet.split("")), [characterSet]);

  /** 获取课程总数 */
  const totalLessonNumber = lessons.length;

  /** 获取当前课程 */
  const currentLesson = useMemo<Lesson>(() => {
    if (currentLessonNumber <= 0 || currentLessonNumber > totalLessonNumber) {
      log.error(`Invalid lesson number: ${currentLessonNumber}`, "LessonManager");
      return { lessonNumber: 0, characters: [], displayText: "" };
    }
    return lessons[currentLessonNumber - 1];
  }, [currentLessonNumber, lessons, totalLessonNumber]);

  // 返回接口
  
  return {
    lessons,
    currentLesson,
    totalLessonNumber,
  };
}