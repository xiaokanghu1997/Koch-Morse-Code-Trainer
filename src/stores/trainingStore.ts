import { create } from 'zustand';
import type { PlaybackState } from '../lib/types';

/**
 * 训练模式
 */
type TrainingMode = 'character' | 'text';

/**
 * 训练状态接口
 */
interface TrainingState {
  // ==================== 状态 ====================
  
  /** 当前课程编号 */
  currentLesson: number;
  
  /** 训练模式（字符/文本） */
  mode: TrainingMode;
  
  /** 当前练习文本 */
  currentText: string;
  
  /** 用户输入 */
  userInput: string;
  
  /** 是否显示答案 */
  showAnswer: boolean;
  
  /** 当前高亮字符索引 */
  highlightedCharIndex: number;
  
  /** 播放状态（来自PlayerController） */
  playbackState: PlaybackState | null;
  
  /** 当前选择的字符（用于字符模式） */
  selectedChar: string | null;
  
  // ==================== Actions ====================
  
  /** 设置当前课程 */
  setCurrentLesson: (num: number) => void;
  
  /** 设置训练模式 */
  setMode: (mode: TrainingMode) => void;
  
  /** 设置当前文本 */
  setCurrentText: (text: string) => void;
  
  /** 设置用户输入 */
  setUserInput: (input: string) => void;
  
  /** 切换答案显示 */
  toggleAnswer: () => void;
  
  /** 设置答案显示状态 */
  setShowAnswer: (show: boolean) => void;
  
  /** 设置高亮字符索引 */
  setHighlightedCharIndex: (index: number) => void;
  
  /** 设置播放状态 */
  setPlaybackState: (state: PlaybackState) => void;
  
  /** 设置选择的字符 */
  setSelectedChar: (char: string | null) => void;
  
  /** 计算准确率 */
  calculateAccuracy: () => number;
  
  /** 重置练习状态 */
  resetPractice: () => void;
  
  /** 重置所有状态 */
  reset: () => void;
}

/**
 * 创建训练Store
 */
export const useTrainingStore = create<TrainingState>((set, get) => ({
  // ==================== 初始状态 ====================
  
  currentLesson: 1,
  mode: 'text',
  currentText: '',
  userInput: '',
  showAnswer: false,
  highlightedCharIndex: -1,
  playbackState: null,
  selectedChar: null,
  
  // ==================== Actions ====================
  
  setCurrentLesson: (num) => set({ currentLesson: num }),
  
  setMode: (mode) => set({ mode, selectedChar: null }),
  
  setCurrentText: (text) => set({ currentText: text, userInput: '', showAnswer: false }),
  
  setUserInput: (input) => set({ userInput: input }),
  
  toggleAnswer: () => set((state) => ({ showAnswer: ! state.showAnswer })),
  
  setShowAnswer: (show) => set({ showAnswer: show }),
  
  setHighlightedCharIndex: (index) => set({ highlightedCharIndex: index }),
  
  setPlaybackState: (state) => set({ playbackState: state }),
  
  setSelectedChar: (char) => set({ selectedChar: char }),
  
  /**
   * 计算准确率
   * 
   * 比较用户输入和当前文本（忽略空格）
   */
  calculateAccuracy: () => {
    const { currentText, userInput } = get();
    
    // 移除所有空格
    const textClean = currentText.replace(/ /g, '').toUpperCase();
    const inputClean = userInput.replace(/ /g, '').toUpperCase();
    
    if (textClean.length === 0) return 0;
    
    // 计算正确字符数
    let correctCount = 0;
    const minLength = Math.min(textClean.length, inputClean.length);
    
    for (let i = 0; i < minLength; i++) {
      if (textClean[i] === inputClean[i]) {
        correctCount++;
      }
    }
    
    // 准确率 = 正确字符数 / 文本总长度
    const accuracy = correctCount / textClean.length;
    
    return accuracy;
  },
  
  /**
   * 重置练习状态
   * 
   * 保留课程和模式，清空其他状态
   */
  resetPractice: () =>
    set({
      currentText: '',
      userInput: '',
      showAnswer: false,
      highlightedCharIndex: -1,
      playbackState: null,
    }),
  
  /**
   * 重置所有状态
   */
  reset: () =>
    set({
      currentLesson: 1,
      mode: 'text',
      currentText: '',
      userInput: '',
      showAnswer: false,
      highlightedCharIndex: -1,
      playbackState: null,
      selectedChar: null,
    }),
}));