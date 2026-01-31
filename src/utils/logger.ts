import { debug, info, warn, error, trace } from "@tauri-apps/plugin-log";

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  TRACE = "TRACE",
}

/**
 * 日志配置
 */
interface LogConfig {
  /** 是否启用控制台输出 */
  enableConsole: boolean;
  /** 最低日志级别 */
  minLevel: LogLevel;
  /** 是否启用时间戳 */
  enableTimestamp: boolean;
}

class Logger {
  private config: LogConfig = {
    // 默认不启用控制台输出
    enableConsole: false,
    // 开发环境DEBUG，生产环境INFO
    minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
    enableTimestamp: true,
  };

  /**
   * 格式化消息
   */
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = this.config.enableTimestamp 
      ? new Date().toISOString().substring(11, 23)  // HH:mm:ss.SSS
      : "";
    
    const contextStr = context ? `[${context}]` : "";
    
    return `${timestamp} ${level} ${contextStr} ${message}`.trim();
  }

  /**
   * 格式化数据为字符串
   */
  private formatData(data: any): string {
    if (data === undefined || data === null) return "";
    
    try {
      if (typeof data === "object") {
        return JSON.stringify(data, null, 2);
      }
      return String(data);
    } catch {
      return "[Circular]";
    }
  }

  /**
   * Debug 日志 - 详细的调试信息
   */
  debug(message: string, context?: string, data?: any) {
    const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
    const dataStr = this.formatData(data);
    const fullMessage = dataStr ? `${formatted} ${dataStr}` : formatted;
    
    debug(fullMessage);
  }

  /**
   * Info 日志 - 一般信息
   */
  info(message: string, context?: string, data?: any) {
    const formatted = this.formatMessage(LogLevel.INFO, message, context);
    const dataStr = this.formatData(data);
    const fullMessage = dataStr ? `${formatted} ${dataStr}` : formatted;
    
    info(fullMessage);
  }

  /**
   * Warn 日志 - 警告信息
   */
  warn(message: string, context?: string, data?: any) {
    const formatted = this.formatMessage(LogLevel.WARN, message, context);
    const dataStr = this.formatData(data);
    const fullMessage = dataStr ? `${formatted} ${dataStr}` : formatted;
    
    warn(fullMessage);
  }

  /**
   * Error 日志 - 错误信息
   */
  error(message: string, context?: string, err?: Error | any) {
    const formatted = this.formatMessage(LogLevel.ERROR, message, context);
    
    let errorData = "";
    if (err instanceof Error) {
      errorData = JSON.stringify({
        message: err.message,
        stack: err.stack,
        name: err.name,
      }, null, 2);
    } else if (err) {
      errorData = this.formatData(err);
    }
    
    const fullMessage = errorData ? `${formatted} ${errorData}` : formatted;
    
    error(fullMessage);
  }

  /**
   * Trace 日志 - 函数调用追踪
   */
  trace(message: string, context?: string) {
    const formatted = this.formatMessage(LogLevel.TRACE, message, context);
    
    trace(formatted);
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// 导出单例
export const logger = new Logger();

// 导出便捷方法
export const log = {
  debug: (msg: string, ctx?: string, data?: any) => logger.debug(msg, ctx, data),
  info: (msg: string, ctx?: string, data?: any) => logger.info(msg, ctx, data),
  warn: (msg: string, ctx?: string, data?: any) => logger.warn(msg, ctx, data),
  error: (msg: string, ctx?: string, err?: any) => logger.error(msg, ctx, err),
  trace: (msg: string, ctx?: string) => logger.trace(msg, ctx),
};