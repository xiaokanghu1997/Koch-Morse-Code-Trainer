import { invoke } from "@tauri-apps/api/core";
import { log } from "../utils/logger";

/**
 * 随机获取单词
 * @param count 获取单词数量
 * @param datasets 数据集名称列表
 * @returns 单词列表
 */
export async function getRandomWords(
  count: number, 
  datasets: string[]
): Promise<string[]> {
  try {
    return await invoke("get_random_words", { count, datasets });
  } catch (error) {
    log.error("Failed to get random words", "DataLoader", error);
    return [];
  }
}

/**
 * 随机获取呼号
 * @param count 获取呼号数量
 * @param filter 过滤器类型
 * @returns 呼号列表
 */
export async function getRandomCallsigns(
  count: number,
  filter: string
): Promise<string[]> {
  try {
    return await invoke("get_random_callsigns", { count, filter });
  } catch (error) {
    log.error("Failed to get random callsigns", "DataLoader", error);
    return [];
  }
}