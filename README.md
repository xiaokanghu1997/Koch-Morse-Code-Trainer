# Koch - Morse Code Trainer

**基于 Koch 方法的摩尔斯电码学习工具**

## 版本信息
- **当前版本**：v2.0.0
- **作者**：Xiaokang HU
- **更新日期**：2026-06-09

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-开发中-yellow.svg)

## 📖 项目简介

Koch 是一款专业的摩尔斯电码学习训练工具，面向业余无线电爱好者的全阶段学习需求。软件以经典 Koch 方法为基础，提供基础训练（字符训练）、进阶训练（单词、呼号、QTC 训练）、训练统计分析、活动热力图等功能，帮助用户系统提升摩尔斯电码的收发能力。

## ✨ 主要特性

- 🎓 **基础字符训练**：遵循 Koch 方法的渐进式字符学习
- 🚀 **进阶难度训练**：进阶的单词、呼号、QTC 报文训练
- 🔊 **可调节音频参数**：自定义音调频率、速度（WPM）、Farnsworth 间隔等
- 📊 **可视化数据分析**：训练记录统计、排行榜统计、练习活跃度显示，多维度追踪训练情况
- 🎨 **简洁美观界面**：深浅主题切换、窗口透明度调节、中英文界面调整
- 📝 **多种字符训练模式**：支持 Koch-LCWO 字符集，以及英文、数字、标点字符集
- 💾 **数据存储与管理**：自动保存训练进度、本地数据存储

## 📚 软件演示

<div align="center">
  <img src="dist/assets/software-info.gif" width="900">
</div>


## 🛠️ 技术栈

- **应用框架**：Tauri 2 + Rust
- **前端组件**：React 19 + Fluent UI v9
- **数据可视化**：SVG + React Spring
- **状态管理**：Zustand
- **音频处理**：Tone

## 🗺️ 开发计划
### 已完成

- [x] 基础训练（Koch-LCWO 字符集，以及英文、数字、标点字符集）
- [x] 进阶训练（单词训练、呼号训练、QTC 训练）
- [x] 音频参数设置
- [x] 数据统计分析
- [x] 活动热力图
- [x] 多语言支持

### 计划中

- [ ] 发报训练

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📮 联系方式

**作者**：Xiaokang HU

- GitHub: [@xiaokanghu1997](https://github.com/xiaokanghu1997)
- Email: xiaokangh@foxmail.com

## 🙏 致谢

- Koch 方法由 Ludwig Koch 发明
- 感谢所有业余无线电爱好者的支持
- 参考了 [jscwlib](https://fkurz.net/ham/jscwlib.html)、[LCWO.net](https://lcwo.net) 等优秀项目