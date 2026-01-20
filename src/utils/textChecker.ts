/**
 * 检查结果接口
 */
export interface CheckResult {
  /** 准确率 (0-1) */
  accuracy: number;
  /** 正确字符数 */
  correctCount: number;
  /** 总字符数 */
  totalCount: number;
  /** 错误的字符列表 */
  errorChars: string[];
  /** 详细比对结果 */
  details: {
    expected: string;  // 标准答案（去除空格）
    actual: string;    // 用户输入（去除空格）
    matches: boolean[]; // 每个字符是否匹配
  };
}

/**
 * 检查用户输入
 * 
 * @param userInput - 用户输入的文本
 * @param correctText - 标准答案
 * @returns 检查结果
 */
export function checkText(userInput: string, correctText: string): CheckResult {
  // 1.标准化：转大写，移除所有空格
  const expected = correctText.replace(/\s/g, '').toUpperCase();
  const actual = userInput.replace(/\s/g, '').toUpperCase();
  
  // 2.计算匹配情况
  const matches: boolean[] = [];
  const errorChars: string[] = [];
  let correctCount = 0;
  
  const maxLength = Math.max(expected.length, actual.length);
  
  for (let i = 0; i < maxLength; i++) {
    const expectedChar = expected[i] || '';
    const actualChar = actual[i] || '';
    
    const isMatch = expectedChar === actualChar;
    matches.push(isMatch);
    
    if (isMatch && expectedChar !== '') {
      correctCount++;
    } else if (!isMatch && expectedChar !== '') {
      // 记录用户输错的字符（应该是什么）
      errorChars.push(expectedChar);
    }
  }
  
  // 3.计算准确率
  const totalCount = expected.length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  
  return {
    accuracy,
    correctCount,
    totalCount,
    errorChars,
    details: {
      expected,
      actual,
      matches,
    },
  };
}

/**
 * 格式化准确率为百分比字符串
 */
export function formatAccuracy(accuracy: number): string {
  return `${(accuracy * 100).toFixed(1)}%`;
}

/**
 * 获取准确率等级
 */
export function getAccuracyGrade(accuracy: number): {
  grade: string;
  color: 'success' | 'warning' | 'error';
  message: string;
} {
  if (accuracy >= 0.9) {
    return {
      grade: 'Excellent',
      color: 'success',
      message: 'Great job! You can move to the next lesson.',
    };
  } else if (accuracy >= 0.7) {
    return {
      grade: 'Good',
      color: 'warning',
      message: 'Good progress! Practice a bit more to improve.',
    };
  } else {
    return {
      grade: 'Need Practice',
      color: 'error',
      message: 'Keep practicing! You will improve with more practice.',
    };
  }
}