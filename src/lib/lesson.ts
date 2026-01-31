import type { Lesson } from "./types";
import { log } from "../utils/logger";

/**
 * 根据字符集生成 Koch 课程列表
 * 
 * Koch 方法：
 * - 第1课：前2个字符 (K, M)
 * - 第2课：前3个字符 (K, M, U)
 * - 第3课：前4个字符 (K, M, U, R)
 * - ...
 * 
 * @param characterSet - 字符集数组，如 ["K", "M", "U", "R", ...]
 * @returns 课程列表
 */
export function generateLessons(characterSet: string[]): Lesson[] {
  if (characterSet.length < 2) {
    log.error("Character set too short for Koch method", "GenerateLessons");
    return [];
  }

  const lessons: Lesson[] = [];
  
  // 第1课从2个字符开始
  for (let i = 2; i <= characterSet.length; i++) {
    const lessonNumber = i - 1;  // 第1课用前2个字符
    const characters = characterSet.slice(0, i);
    const displayText = formatLessonDisplay(lessonNumber, characters);
    
    lessons.push({
      lessonNumber,
      characters,
      displayText,
    });
  }
  
  return lessons;
}

/**
 * 格式化课程显示文本
 * 
 * - 第1课（2个字符）: "01 - K, M"
 * - 第2课（新增1个字符）: "02 - U"
 * - 第3课（新增1个字符）: "03 - R"
 * 
 * @param lessonNumber - 课程编号（1-based）
 * @param characters - 该课程的所有字符
 * @returns 格式化的显示文本
 */
export function formatLessonDisplay(lessonNumber: number, characters: string[]): string {
  const lessonStr = lessonNumber.toString().padStart(2, "0");
  
  if (lessonNumber === 1) {
    // 第1课显示所有字符（2个）
    return `${lessonStr} - ${characters.join(", ")}`;
  } else {
    // 后续课程只显示新增的字符（最后1个）
    const newChar = characters[characters.length - 1];
    return `${lessonStr} - ${newChar}`;
  }
}

/**
 * 获取指定课程的字符列表
 * 
 * @param characterSet - 字符集数组
 * @param lessonNumber - 课程编号（1-based）
 * @returns 该课程包含的所有字符
 */
export function getLessonCharacters(characterSet: string[], lessonNumber: number): string[] {
  if (lessonNumber < 1 || lessonNumber > characterSet.length - 1) {
    log.error(`Invalid lesson number: ${lessonNumber}`, "GenerateLessons");
    return [];
  }
  
  // 第1课用前2个字符，第2课用前3个字符...
  return characterSet.slice(0, lessonNumber + 1);
}