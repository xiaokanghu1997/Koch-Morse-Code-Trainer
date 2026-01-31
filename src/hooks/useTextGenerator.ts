import { useState, useCallback, useRef } from "react";
import { TextGenerator } from "../services/textGenerator";
import { TimingCalculator } from "../lib/timing";
import { CHARACTER_SET } from "../lib/constants";
import type { GeneratorConfig } from "../lib/types";
import { log } from "../utils/logger";

export interface UseTextGeneratorReturn {
  /** 生成的文本 */
  text: string;
  /** 预估时长（秒） */
  duration: number;
  /** 生成普通文本 */
  generate: (config: GeneratorConfig, currentCharSet?: string) => void;
  /** 生成单字符文本 */
  generateSingleChar: (char: string, count: number, config: GeneratorConfig) => void;
}

/**
 * 文本生成 Hook
 * 
 * 功能：
 * - 生成训练文本
 * - 生成单字符重复文本
 * - 自动计算播放时长
 */
export const useTextGenerator = (): UseTextGeneratorReturn => {
  const [text, setText] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  
  const textGenRef = useRef(new TextGenerator());

  /** 生成普通文本 */
  const generate = useCallback((config: GeneratorConfig, currentCharSet?: string) => {
    
    try {
      // 生成文本
      const generatedText = textGenRef.current.generate({
        charSet: currentCharSet || CHARACTER_SET[config.datasetName],
        mode: config.practiceMode,
        groupLength: config.groupLength,
        randomGroupLength: config.randomGroupLength,
        groupSpace: config.groupSpace,
        groupCount: config.groupCount,
        usePrefixSuffix: config.usePrefixSuffix,
      });

      // 计算时长
      const timingCalc = new TimingCalculator({
        charSpeed: config.charSpeed,
        effSpeed: config.effSpeed,
        tone: config.tone,
      });
      const calculatedDuration = timingCalc.calculateTextDuration(generatedText);

      // 更新状态
      setText(generatedText);
      setDuration(calculatedDuration);

      log.debug("Text generated", "useTextGenerator", {
        textLength: generatedText.length,
        duration: calculatedDuration.toFixed(2),
      });
    } catch (error) {
      log.error("Failed to generate text", "useTextGenerator", error);
      setText("");
      setDuration(0);
    }
  }, []);

  /** 生成单字符文本 */
  const generateSingleChar = useCallback((
    char: string, 
    count: number, 
    config: GeneratorConfig
  ) => {
    
    try {
      // 生成单字符文本
      const generatedText = textGenRef.current.generateSingleCharacter(char, count);

      // 计算时长
      const timingCalc = new TimingCalculator({
        charSpeed: config.charSpeed,
        effSpeed: config.effSpeed,
        tone: config.tone,
      });
      const calculatedDuration = timingCalc.calculateTextDuration(generatedText);

      // 更新状态
      setText(generatedText);
      setDuration(calculatedDuration);

      log.debug("Single char text generated", "useTextGenerator", {
        char,
        count,
        duration: calculatedDuration.toFixed(2),
      });
    } catch (error) {
      log.error("Failed to generate single char text", "useTextGenerator", error);
      setText("");
      setDuration(0);
    } finally {
    }
  }, []);

  // 返回接口
  return {
    text,
    duration,
    generate,
    generateSingleChar,
  };
};