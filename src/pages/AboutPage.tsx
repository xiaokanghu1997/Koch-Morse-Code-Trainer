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
  Heart24Regular
} from "@fluentui/react-icons";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  card: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
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
  
  // 软件信息
  const appTitle = "Koch - Morse Code Trainer";
  const version = "Version 0.0.0";

  return (
    <div className={styles.container}>
      {/* 软件信息 */}
      <Card className={styles.card}>
        <Apps24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>{appTitle}</Text>
          <Text className={styles.description}>
            © 2026 Xiaokang HU. Licensed under MIT.
          </Text>
        </div>
        <Text className={styles.value}>{version}</Text>
      </Card>

      {/* 设计目的 */}
      <Card className={styles.card}>
        <TargetArrow24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Purpose</Text>
          <Text className={styles.description}>
            Koch-method listening and copying practice
          </Text>
        </div>
        <Text className={styles.value}>
          Train faster and more accurate decoding
        </Text>
      </Card>

      {/* 联系方式 */}
      <Card className={styles.card}>
        <Mail24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Contact</Text>
          <Text className={styles.description}>
            Get in touch with the developer
          </Text>
        </div>
        <Text className={styles.value}>xiaokangh@foxmail.com</Text>
      </Card>

      {/* 致谢信息 */}
      <Card className={styles.card}>
        <Heart24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Acknowledgements</Text>
          <Text className={styles.description}>
            Thanks for the inspiration and support
          </Text>
        </div>
        <Text className={styles.value}>
          Inspired and supported by <Link href="https://fkurz.net/ham/jscwlib.html" target="_blank">jscwlib</Link>
        </Text>
      </Card>
    </div>
  );
};