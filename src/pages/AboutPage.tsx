import { 
  Text, 
  Card,
  Link,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import {
  Apps24Regular,
  TargetArrow24Regular,
  Mail24Regular,
  Heart24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DataManagement } from "../components/DataManagement";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    gap: "8px",
  },
  card: {
    minHeight: "60px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
    boxShadow: tokens.shadow2,
  },
  icon: {
    color: tokens.colorBrandForeground1,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textAlign: "right",
    flexShrink: 0,
  },
});

export const AboutPage = () => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  
  // 软件信息
  const appTitle = "Koch - Morse Code Trainer";
  const version = "2.0.0";

  return (
    <div className={styles.container}>
      {/* 软件信息 */}
      <Card className={styles.card}>
        <DataManagement>
          <Apps24Regular className={styles.icon} />
        </DataManagement>
        <div className={styles.content}>
          <Text className={styles.header}>{appTitle}</Text>
          <Text className={styles.description}>
            {t("about.title.copyright", { info: "© 2026 Xiaokang HU · MIT" })}
          </Text>
        </div>
        <Text className={styles.value}>{t("about.title.version", { version })}</Text>
      </Card>

      {/* 设计目的 */}
      <Card className={styles.card}>
        <TargetArrow24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>{t("about.purpose.header")}</Text>
          <Text className={styles.description}>
            {t("about.purpose.description")}
          </Text>
        </div>
        <Text className={styles.value}>{t("about.purpose.value")}</Text>
      </Card>

      {/* 联系方式 */}
      <Card className={styles.card}>
        <Mail24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>{t("about.contact.header")}</Text>
          <Text className={styles.description}>{t("about.contact.description")}</Text>
        </div>
        <Text className={styles.value}>xiaokangh@foxmail.com</Text>
      </Card>

      {/* 致谢信息 */}
      <Card className={styles.card}>
        <Heart24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>{t("about.acknowledgements.header")}</Text>
          <Text className={styles.description}>{t("about.acknowledgements.description")}</Text>
        </div>
        <Text className={styles.value}>
          {t("about.acknowledgements.value")} <Link href="https://lcwo.net/" target="_blank">LCWO</Link>
        </Text>
      </Card>
    </div>
  );
};