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

export const ScorePage = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {/* 分数结果 */}
      <h2>Score</h2>
      {/* 添加你的练习逻辑 */}
    </div>
  );
};