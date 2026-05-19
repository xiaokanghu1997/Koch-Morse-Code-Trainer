import { useBasicsStore } from "../stores/basicsStore";
import { useAdvancedStore } from "../stores/advancedStore";
import { log } from "../utils/logger";

/**
 * 统一导出的数据格式
 */
interface ExportedData {
  /** 基础训练数据 */
  basics: {
    currentDatasetName: string;
    currentLessonNumber: number;
    datasets: Record<string, Record<number, any[]>>;
  };

  /** 进阶训练数据 */
  advanced: {
    Word: any[];
    Callsign: any[];
    QTC: any[];
  };
}

/**
 * 统一数据管理服务
 */
class RecordManager {
  /** 
   * 导出所有训练数据为 JSON 字符串 
   * @returns JSON 数据字符串
   */
  exportData(): string {
    const basicsStore = useBasicsStore.getState();
    const advancedStore = useAdvancedStore.getState();

    const exportData: ExportedData = {
      basics: {
        currentDatasetName: basicsStore.currentDatasetName,
        currentLessonNumber: basicsStore.currentLessonNumber,
        datasets: basicsStore.datasets,
      },
      advanced: {
        Word: advancedStore.Word,
        Callsign: advancedStore.Callsign,
        QTC: advancedStore.QTC,
      },
    };
    
    log.info("Training data exported", "RecordManager");
    return JSON.stringify(exportData, null, 2);
  }

  /** 
   * 导入训练数据
   * @param jsonData - JSON 数据字符串
   * @returns 是否导入成功
   */
  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData) as ExportedData;

      // 验证数据格式
      if (!importedData.basics || !importedData.advanced) {
        log.error("Invalid data format for import", "RecordManager");
        return false;
      }

      // 验证基础训练数据结构
      if (!importedData.basics.datasets || typeof importedData.basics.datasets !== "object") {
        log.error("Invalid basics data structure", "RecordManager");
        return false;
      }
      
      // 验证进阶训练数据结构
      if (
        !Array.isArray(importedData.advanced.Word) ||
        !Array.isArray(importedData.advanced.Callsign) ||
        !Array.isArray(importedData.advanced.QTC)
      ) {
        log.error("Invalid advanced data structure", "RecordManager");
        return false;
      }

      // 导入基础训练数据
      useBasicsStore.setState({
        currentDatasetName: importedData.basics.currentDatasetName || "Koch-LCWO",
        currentLessonNumber: importedData.basics.currentLessonNumber || 1,
        datasets: importedData.basics.datasets,
      });

      // 导入进阶训练数据
      useAdvancedStore.setState({
        Word: importedData.advanced.Word,
        Callsign: importedData.advanced.Callsign,
        QTC: importedData.advanced.QTC,
      });

      log.info("Training data imported", "RecordManager");
      return true;
    } catch (error) {
      log.error("Failed to import data", "RecordManager", { error });
      return false;
    }
  }

  /** 
   * 清空所有训练数据 
   */
  clearAllData(): void {
    useBasicsStore.setState({
      currentDatasetName: "Koch-LCWO",
      currentLessonNumber: 1,
      datasets: {},
    });
    useAdvancedStore.setState({
      Word: [],
      Callsign: [],
      QTC: [],
    });
    log.info("All training data cleared", "RecordManager");
  }

  /**
   * 修改基础训练记录
   * @param datasetName - 训练集名称
   * @param lessonNumber - 课程编号
   * @param recordIndex - 记录索引
   * @param updatedRecord - 更新后的记录数据
   * @returns 是否修改成功
   */
  modifyBasicsRecord(
    datasetName: string,
    lessonNumber: number,
    recordIndex: number,
    updatedRecord: { timestamp: number; duration: number; accuracy: number }
  ): boolean {
    const basicsStore = useBasicsStore.getState();
    // 验证课程是否存在
    const lessonRecords = basicsStore.datasets[datasetName]?.[lessonNumber];
    if (!lessonRecords || recordIndex < 0 || recordIndex >= lessonRecords.length) {
      log.error("Invalid record parameters", "RecordManager", {
        datasetName,
        lessonNumber,
        recordIndex,
      });
      return false;
    }
    // 修改记录
    useBasicsStore.setState({
      datasets: {
        ...basicsStore.datasets,
        [datasetName]: {
          ...basicsStore.datasets[datasetName],
          [lessonNumber]: basicsStore.datasets[datasetName][lessonNumber].map((record, index) =>
            index === recordIndex ? { ...updatedRecord } : record
          ),
        },
      },
    });
    log.info("Basics record modified", "RecordManager", {
      datasetName,
      lessonNumber,
      recordIndex,
    });
    return true;
  }

  /**
   * 修改进阶训练记录
   * @param trainingType - 训练类型（Word/Callsign/QTC）
   * @param recordIndex - 记录索引
   * @param updatedRecord - 更新后的记录数据
   * @return 是否修改成功
   */
  modifyAdvancedRecord(
    trainingType: "Word" | "Callsign" | "QTC",
    recordIndex: number,
    updatedRecord: { timestamp: number; duration: number; charSpeed: number; score: number }
  ): boolean {
    const advancedStore = useAdvancedStore.getState();
    const records = advancedStore[trainingType];
    // 验证训练类型和记录索引
    if (recordIndex < 0 || recordIndex >= records.length) {
      log.error("Invalid record parameters", "RecordManager", {
        trainingType,
        recordIndex,
      });
      return false;
    }
    // 修改记录
    useAdvancedStore.setState({
      [trainingType]: records.map((record, index) =>
        index === recordIndex ? { ...updatedRecord } : record
      ),
    });
    log.info("Advanced record modified", "RecordManager", {
      trainingType,
      recordIndex,
    });
    return true;
  }

  /**
   * 删除基础训练记录
   * @param datasetName - 训练集名称
   * @param lessonNumber - 课程编号
   * @param recordIndex - 记录索引
   * @return 是否删除成功
   */
  deleteBasicsRecord(
    datasetName: string,
    lessonNumber: number,
    recordIndex: number
  ): boolean {
    const basicsStore = useBasicsStore.getState();
    // 验证课程是否存在
    const lessonRecords = basicsStore.datasets[datasetName]?.[lessonNumber];
    if (!lessonRecords || recordIndex < 0 || recordIndex >= lessonRecords.length) {
      log.error("Invalid record parameters", "RecordManager", {
        datasetName,
        lessonNumber,
        recordIndex,
      });
      return false;
    }
    // 删除记录
    const newLessonRecords = lessonRecords.filter((_, index) => index !== recordIndex);
    // 如果删除后课程没有记录了，则删除整个课程
    if (newLessonRecords.length === 0) {
      const newDataset = { ...basicsStore.datasets[datasetName] };
      delete newDataset[lessonNumber];
      // 如果删除后训练集没有课程了，则删除整个训练集
      if (Object.keys(newDataset).length === 0) {
        const newDatasets = { ...basicsStore.datasets };
        delete newDatasets[datasetName];
        useBasicsStore.setState({
          datasets: newDatasets,
        });
      } else {
        useBasicsStore.setState({
          datasets: {
            ...basicsStore.datasets,
            [datasetName]: newDataset,
          },
        });
      }
    } else {
      useBasicsStore.setState({
        datasets: {
          ...basicsStore.datasets,
          [datasetName]: {
            ...basicsStore.datasets[datasetName],
            [lessonNumber]: newLessonRecords,
          },
        },
      });
    }
    log.info("Basics record deleted", "RecordManager", {
      datasetName,
      lessonNumber,
      recordIndex,    });
    return true;
  }

  /**
   * 删除进阶训练记录
   * @param trainingType - 训练类型（Word/Callsign/QTC）
   * @param recordIndex - 记录索引
   * @return 是否删除成功
   */
  deleteAdvancedRecord(
    trainingType: "Word" | "Callsign" | "QTC",
    recordIndex: number
  ): boolean {
    const advancedStore = useAdvancedStore.getState();
    const records = advancedStore[trainingType];
    // 验证训练类型和记录索引
    if (recordIndex < 0 || recordIndex >= records.length) {
      log.error("Invalid record parameters", "RecordManager", {
        trainingType,
        recordIndex,
      });
      return false;
    }
    // 删除记录
    const newRecords = records.filter((_, index) => index !== recordIndex);
    useAdvancedStore.setState({
      [trainingType]: newRecords,
    });
    log.info("Advanced record deleted", "RecordManager", {
      trainingType,
      recordIndex,
    });
    return true;
  }
}

// 导出 RecordManager 实例
export const recordManager = new RecordManager();