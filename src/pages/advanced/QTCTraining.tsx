import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "10px",
    gap: "10px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: "4px",
    overflow: "auto",
  },
});

export const QTCTraining = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {/* QTC 练习内容 */}
      <h2>QTC Training</h2>
      {/* 添加你的练习逻辑 */}
    </div>
  );
};