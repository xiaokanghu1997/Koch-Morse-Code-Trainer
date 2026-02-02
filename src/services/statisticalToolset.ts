import type {
  TrainingRecord,
  LessonRecords,
  DatasetRecords,
  GlobalRecords,
  ComparisonTypes,
  ComparisonResult,
  AccuracyResult,
  TimeStatTypes,
  TimeStats,
  TimeStatsResult,
} from "../lib/types";
import { CHARACTER_SET, PREFIX_SUFFIX } from "../lib/constants";

// ==================== 基础统计 ====================

/**
 * 统计各课程总体信息
 * @param records - 训练记录
 * @returns 课程总体统计信息
 */
export function calculateLessonStats(
  records: TrainingRecord[]
): Omit<LessonRecords, "records"> {
  if (records.length === 0) {
    return {
      totalDuration: 0,
      recordCount: 0,
      averageAccuracy: 0,
    };
  }

  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const totalAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0);

  return {
      totalDuration,
      recordCount: records.length,
      averageAccuracy: totalAccuracy / records.length,
  };
}

/**
 * 统计各数据集总体信息
 * @param lessons - 课程统计信息
 * @returns 数据集总体统计信息
 */
export function calculateDatasetStats(
  lessons: Record<number, LessonRecords>
): Omit<DatasetRecords, "lessons"> {
  const lessonList = Object.values(lessons);

  if (lessonList.length === 0) {
    return {
      totalDuration: 0,
      recordCount: 0,
      averageAccuracy: 0,
    };
  }

  const totalDuration = lessonList.reduce((sum, l) => sum + l.totalDuration, 0);
  const recordCount = lessonList.reduce((sum, l) => sum + l.recordCount, 0);

  const totalAccuracy = lessonList.reduce(
    (sum, l) => sum + l.averageAccuracy * l.recordCount,
    0
  );

  return {
    totalDuration,
    recordCount,
    averageAccuracy: recordCount > 0 ? totalAccuracy / recordCount : 0,
  };
}

/**
 * 统计训练总体信息
 * @param datasets - 数据集统计信息
 * @returns 训练总体统计信息
 */
export function calculateGlobalStats(
  datasets: Record<number, DatasetRecords>
): Omit<GlobalRecords, "datasets"> {
  const datasetList = Object.values(datasets);

  if (datasetList.length === 0) {
    return {
      totalDuration: 0,
      recordCount: 0,
      averageAccuracy: 0,
    };
  }

  const totalDuration = datasetList.reduce((sum, d) => sum + d.totalDuration, 0);
  const recordCount = datasetList.reduce((sum, d) => sum + d.recordCount, 0);

  const totalAccuracy = datasetList.reduce(
    (sum, d) => sum + d.averageAccuracy * d.recordCount,
    0
  );

  return {
    totalDuration,
    recordCount,
    averageAccuracy: recordCount > 0 ? totalAccuracy / recordCount : 0,
  };
}

// ==================== 准确率计算 ====================

/**
 * 预处理文本
 * 
 * @param text - 输入文本
 * @returns 预处理后的文本
 */
function preprocessText(text: string): string {
  let processed = text;
  
  // 转换为大写
  processed = processed.toUpperCase();
  
  // 移除前缀（VVV =）和后缀（AR）
  const prefix = PREFIX_SUFFIX.PREFIX.toUpperCase();
  const suffix = PREFIX_SUFFIX.SUFFIX.toUpperCase();
  
  if (processed.startsWith(prefix)) {
    processed = processed.slice(prefix.length);
  }
  
  if (processed.endsWith(suffix)) {
    processed = processed.slice(0, -suffix.length);
  }
  
  // 将多个连续空格替换为单个空格
  processed = processed.replace(/\s+/g, " ");
  
  // 去除首尾空格
  processed = processed.trim();
  
  return processed;
}

/**
 * 对单个组进行比对
 * 
 * @param inputGroup - 用户输入组
 * @param correctGroup - 正确答案组
 * @param startIndex - 该组在整体文本中的起始索引
 * @returns 比对结果及正确字符数
 */
/**
 * 对单个组进行比对，识别四种类型
 */
function compareGroup(
  inputGroup: string,
  correctGroup: string,
  startIndex: number
): {
  comparisons: ComparisonResult[];
  correctCount: number;
} {
  const comparisons: ComparisonResult[] = [];
  let correctCount = 0;

  const m = inputGroup.length;
  const n = correctGroup.length;

  // 情况1: 长度相同 - 直接逐位比对
  if (m === n) {
    for (let i = 0; i < n; i++) {
      if (inputGroup[i] === correctGroup[i]) {
        comparisons.push({
          char: inputGroup[i],
          type: "correct",
          index: startIndex + i,
        });
        correctCount++;
      } else {
        comparisons.push({
          char: inputGroup[i],
          type: "incorrect",
          index: startIndex + i,
        });
      }
    }
    return { comparisons, correctCount };
  }

  // 构建编辑距离矩阵
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // 初始化
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // 填充 DP 矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (inputGroup[i - 1] === correctGroup[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // 匹配
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除（input 多余）
          dp[i][j - 1] + 1,     // 插入（input 缺失）
          dp[i - 1][j - 1] + 1  // 替换（不匹配）
        );
      }
    }
  }

  // 回溯生成比对结果
  let i = m;
  let j = n;
  const tempResults: Array<{ char: string; type: ComparisonTypes }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && inputGroup[i - 1] === correctGroup[j - 1]) {
      // 匹配
      tempResults.unshift({
        char: inputGroup[i - 1],
        type: "correct",
      });
      correctCount++;
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // 替换（incorrect）
      tempResults.unshift({
        char: inputGroup[i - 1],
        type: "incorrect",
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      // 插入（missing）
      tempResults.unshift({
        char: " ",
        type: "missing",
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      // 删除（extra）
      tempResults.unshift({
        char: inputGroup[i - 1],
        type: "extra",
      });
      i--;
    }
  }

  // 情况2: 输入更短 - 确保结果长度 = correctGroup.length
  if (m < n) {
    // 过滤掉 extra（理论上不应该有）
    const filtered = tempResults.filter(r => r.type !== "extra");
    
    // 添加 index
    for (let idx = 0; idx < filtered.length; idx++) {
      comparisons.push({
        char: filtered[idx].char,
        type: filtered[idx].type,
        index: startIndex + idx,
      });
    }

    return { comparisons, correctCount };
  }

  // 情况3: 输入更长 - 正确答案的每个位置都有对应，extra 单独标记
  if (m > n) {
    // 分离 extra 和非 extra
    const mainResults = tempResults.filter(r => r.type !== "extra");
    const extraResults = tempResults.filter(r => r.type === "extra");

    // 添加主结果的 index
    for (let idx = 0; idx < mainResults.length; idx++) {
      comparisons.push({
        char: mainResults[idx].char,
        type: mainResults[idx].type,
        index: startIndex + idx,
      });
    }

    // 添加 extra 结果（index 指向最后一个有效位置）
    for (let idx = 0; idx < extraResults.length; idx++) {
      comparisons.push({
        char: extraResults[idx].char,
        type: "extra",
        index: startIndex + n - 1, // 指向正确答案的最后位置
      });
    }

    return { comparisons, correctCount };
  }

  // 不应该到这里
  return { comparisons, correctCount };
}

/**
 * 计算准确率
 * 
 * 比较用户输入和正确文本，计算字符匹配率
 * 
 * @param userInput - 用户输入文本
 * @param correctText - 正确文本
 * @returns 准确率（0-100）
 */
export function calculateAccuracy(
  userInput: string, 
  correctText: string
): AccuracyResult {
// 预处理文本
  const input = preprocessText(userInput);
  const correct = preprocessText(correctText);

  // 按空格分组
  const inputGroups = input.split(" ");
  const correctGroups = correct.split(" ");

  const comparisons: ComparisonResult[] = [];
  let correctCount = 0;
  let currentIndex = 0;

  // 按组进行比对
  const maxGroups = Math.max(inputGroups.length, correctGroups.length);

  for (let g = 0; g < maxGroups; g++) {
    const inputGroup = g < inputGroups.length ? inputGroups[g] : "";
    const correctGroup = g < correctGroups.length ? correctGroups[g] : "";

    if (correctGroup === "" && inputGroup !== "") {
      // 正确答案没有这个组，用户多输入了（全部是 extra）
      for (let i = 0; i < inputGroup.length; i++) {
        comparisons.push({
          char: inputGroup[i],
          type: "extra",
          index: currentIndex,
        });
      }
    } else if (correctGroup !== "" && inputGroup === "") {
      // 用户缺失了整个组（全部是 missing）
      for (let i = 0; i < correctGroup.length; i++) {
        comparisons.push({
          char: " ",
          type: "missing",
          index: currentIndex + i,
        });
      }
      currentIndex += correctGroup.length;
    } else if (correctGroup !== "" && inputGroup !== "") {
      // 正常比对
      const groupResult = compareGroup(inputGroup, correctGroup, currentIndex);
      comparisons.push(...groupResult.comparisons);
      correctCount += groupResult.correctCount;
      currentIndex += correctGroup.length;
    }

    // 添加组间空格（除了最后一组）
    if (g < correctGroups.length - 1) {
      if (g < inputGroups.length - 1 && g < correctGroups.length - 1) {
        // 两边都有空格 - 正确
        comparisons.push({
          char: " ",
          type: "correct",
          index: currentIndex,
        });
      } else if (g < correctGroups.length - 1) {
        // 正确答案有空格，用户输入没有 - 缺失
        comparisons.push({
          char: " ",
          type: "missing",
          index: currentIndex,
        });
      }
      currentIndex++;
    }

    // 处理用户输入多余的组间空格
    if (g >= correctGroups.length - 1 && g < inputGroups.length - 1) {
      comparisons.push({
        char: " ",
        type: "extra",
        index: currentIndex - 1,
      });
    }
  }

  // 计算准确率（总字符数取较大值）
  const inputWithoutSpaces = input.replace(/\s+/g, "");
  const correctWithoutSpaces = correct.replace(/\s+/g, "");
  const totalCount = Math.max(inputWithoutSpaces.length, correctWithoutSpaces.length);
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  return {
    accuracy,
    comparisons,
    correctText: correct,
  }
}

// ==================== 时间范围统计 ====================

/**
 * 获取各时间段统计课程练习数据
 * 
 * 将训练记录按指定时间粒度分组，计算每个时间段的总练习时长、练习次数及平均准确率
 * 
 * @param records - 训练记录
 * @param timeStatType - 时间粒度
 * @returns 时间段统计结果
 */
export function getTimeStats(
  records: TrainingRecord[],
  timeStatType: TimeStatTypes
): TimeStatsResult {
  if (records.length === 0) {
    return {
      timeLabels: [],
      totalDurations: [],
      recordCounts: [],
      averageAccuracies: [],
      details: [],
    };
  }

  // 按时间段分组统计
  const groupedData = new Map<string, {
      displayLabel: string;
      durations: number[];
      accuracies: number[];
  }>();

  records.forEach((record) => {
    const date = new Date(record.timestamp);

    let timeKey = "";
    let displayLabel = "";

    // 根据时间粒度生成时间键和值
    switch (timeStatType) {
      case "hour":
        // 时间格式：2026-01-26 14:00
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:00`;
        // 显示格式：01-26\n14:00
        displayLabel = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}\n${String(date.getHours()).padStart(2, "0")}:00`;
        break;
      case "day":
        // 时间格式：2026-01-26
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        // 显示格式：01-26
        displayLabel = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        break;
      case "month":
        // 时间格式：2026-01
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        // 显示格式：2026-01
        displayLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "year":
        // 时间格式：2026
        timeKey = `${date.getFullYear()}`;
        // 显示格式：2026
        displayLabel = `${date.getFullYear()}`;
        break;
      case "default":
        // 时间格式：2026-01-26 14:12
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        // 显示格式：01-26\n14:12
        displayLabel = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}\n${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        break;
    }

    // 添加到分组数据
    if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, {
            displayLabel,
            durations: [],
            accuracies: [],
        });
    }

    const group = groupedData.get(timeKey)!;
    group.durations.push(record.duration);
    group.accuracies.push(record.accuracy);
  });

  // 排序并统计结果
  const sortedGroups = Array.from(groupedData.entries()).sort((a, b) => 
    a[0].localeCompare(b[0])
  );

  const timeLabels: string[] = [];
  const totalDurations: number[] = [];
  const recordCounts: number[] = [];
  const averageAccuracies: number[] = [];
  const details: TimeStats[] = [];

  sortedGroups.forEach(([_, group]) => {
    const totalDuration = group.durations.reduce((sum, d) => sum + d, 0);
    const recordCount = group.durations.length;
    const totalAccuracy = group.accuracies.reduce((sum, a) => sum + a, 0);
    const averageAccuracy = recordCount > 0 ? totalAccuracy / recordCount : 0;

    timeLabels.push(group.displayLabel);
    totalDurations.push(totalDuration);
    recordCounts.push(recordCount);
    averageAccuracies.push(averageAccuracy);
    details.push({
      timeLabel: group.displayLabel,
      totalDuration,
      recordCount,
      averageAccuracy,
    });
  });

  return {
    timeLabels,
    totalDurations,
    recordCounts,
    averageAccuracies,
    details,
  };
}

/**
 * 获取某年各天的练习次数
 * 
 * @param records - 训练记录
 * @param year - 指定年份
 * @returns 包含各天练习次数的数组
 */
export function getDailyRecordCounts(
  records: TrainingRecord[],
  year: number
): Array<[string, number]> {
  // 过滤出指定年份的记录
  const yearRecords = records.filter((r) => {
    return new Date(r.timestamp).getFullYear() === year;
  });

  // 按天统计练习次数
  const result = getTimeStats(yearRecords, "day");

  // 转换为 Array 格式
  const countMap: Record<string, number> = {};
  result.details.forEach((detail, index) => {
    // 生成完整日期字符串：YYYY-MM-DD
    const fullDate = `${year}-${result.timeLabels[index]}`;
    countMap[fullDate] = detail.recordCount;
  });
  return Object.entries(countMap).map(([date, count]) => [date, count]);
}

/**
 * 获取各数据集的统计信息
 * 
 * @param globalRecords - 全局训练记录统计信息
 * @returns 包含各数据集统计信息的数组
 */
export function getAllDatasetStats(
  globalRecords: GlobalRecords,
): Array<{ 
  datasetName: string;
  lessonProgress: string;
  totalRecordCount: string;
  totalDuration: string;
  averageAccuracy: string;
}> {
  const allDatasetNames = Object.keys(CHARACTER_SET) as Array<keyof typeof CHARACTER_SET>;

  const datasetStats: Array<any> = [];

  // 遍历所有数据集
  allDatasetNames.forEach((datasetName) => {
    const dataset = globalRecords.datasets[datasetName];

    let totalDuration = 0;
    let recordCount = 0;
    let averageAccuracy = 0;
    let completedLessons = 0;

    // 如果该数据集存在记录
    if (dataset) {
      // 收集该数据集的所有练习记录
      totalDuration = dataset.totalDuration;
      recordCount = dataset.recordCount;
      averageAccuracy = dataset.averageAccuracy;
      completedLessons = Object.keys(dataset.lessons).length;
    }

    // 获取总课程数
    const totalLessons = String(getTotalLessons(datasetName));

    // 统计信息
    datasetStats.push({
      datasetName,
      lessonProgress: `${String(completedLessons)} / ${totalLessons}`,
      totalRecordCount: recordCount.toString(),
      totalDuration: formatDuration(totalDuration),
      averageAccuracy: formatAccuracy(averageAccuracy),
    });
  });
  return datasetStats;
}

/**
 * 获取某年的概览统计
 * 
 * @param records - 训练记录
 * @param year - 年份
 * @returns 概览统计数据
 */
export function getYearOverviewStats(
  records: TrainingRecord[],
  year: number
): {
  totalRecordCount: number;
  totalDuration: number;
  averageAccuracy: number;
} {
  // 过滤指定年份的记录
  const yearRecords = records.filter((r) => {
    return new Date(r.timestamp).getFullYear() === year;
  });

  if (yearRecords.length === 0) {
    return {
      totalRecordCount: 0,
      totalDuration: 0,
      averageAccuracy: 0,
    };
  }

  const totalDuration = yearRecords.reduce((sum, r) => sum + r.duration, 0);
  const totalAccuracy = yearRecords.reduce((sum, r) => sum + r.accuracy, 0);

  return {
    totalRecordCount: yearRecords.length,
    totalDuration,
    averageAccuracy: totalAccuracy / yearRecords.length,
  };
}

/**
 * 获取包含所有练习的年份
 * @param records - 训练记录
 * @returns 包含所有练习年份的数组
 */
export function getAllYears(records: TrainingRecord[]): number[] {
  const yearSet = new Set<number>();

  records.forEach((record) => {
    const year = new Date(record.timestamp).getFullYear();
    yearSet.add(year);
  });

  const years = Array.from(yearSet);
  years.sort((a, b) => a - b);  // 升序排序
  return years;
}

// ==================== 格式化工具 ====================

/**
 * 格式化时长（秒 -> 可读格式）
 * - 小于60秒: "45s"
 * - 小于1小时: "3m 14s"
 * - 大于1小时: "1h 23m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    const secs = Math.floor(seconds);
    return `${secs}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * 格式化精确度
 */
export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(2)}%`;
}

/**
 * 获取数据集的总课程数
 */
export function getTotalLessons(datasetName: string): number {
  if (datasetName in CHARACTER_SET) {
    return CHARACTER_SET[datasetName as keyof typeof CHARACTER_SET].length - 1;
  }
  return 0;
}