import { makeStyles, tokens } from "@fluentui/react-components";
import type { AccuracyResult } from "../lib/types";

const useStyles = makeStyles({
  container: {
    fontFamily: tokens.fontFamilyMonospace, 
    fontSize: "15px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: "20px",
    padding: "0",
    margin: "0",
  },
  separator: {
    color: tokens.colorNeutralStroke1Selected,
  },
  correctText: {
    color: tokens.colorNeutralStroke1Selected,
  },
});

interface HighlightedTextProps {
  result: AccuracyResult;
}

export const HighlightedText = ({ result }: HighlightedTextProps) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {/* 用户输入的高亮结果 */}
      <div>
        {result.comparisons.map((comp, index) => {
          let color = "";
          let backgroundColor = "";
          
          switch (comp.type) {
            case "correct":
              color = "#69b330";
              break;
            case "incorrect":
              color = "#f94144";
              backgroundColor = "#fee4e5";
              break;
            case "missing":
              color = "#f8be37";
              backgroundColor = "#fef6e2";
              break;
            case "extra":
              color = "#277da1";
              backgroundColor = "#dbeef6";
              break;
          }
          
          return (
            <span key={index} style={{ color, backgroundColor }}>
              {comp.char}
            </span>
          );
        })}
      </div>
      
      {/* 分隔线 */}
      <div className={styles.separator}>
        <span>{"-".repeat(result.correctText.length)}</span>
      </div>

      
      {/* 正确答案 */}
      <div className={styles.correctText}>
        {result.correctText}
      </div>
    </div>
  );
};