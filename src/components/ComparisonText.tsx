import { makeStyles, tokens } from "@fluentui/react-components";
import type { AccuracyResult } from "../lib/types";

const useStyles = makeStyles({
  text: {
    fontSize: "12.5px",
    fontFamily: tokens.fontFamilyMonospace,
    display: "block",
    lineHeight: "normal",
    padding: "0px",
    paddingLeft: "1.5px",
    whiteSpace: "nowrap",
  },
});

interface ComparisonTextProps {
  result: AccuracyResult;
}

export const ComparisonText = ({ result }: ComparisonTextProps) => {
  const styles = useStyles();

  return (
    <span className={styles.text}>
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

        const displayChar = comp.type === "missing" && comp.char === " " 
          ? "_"
          : comp.char;
        
        return (
          <span key={index} style={{ color, backgroundColor }}>
            {displayChar}
          </span>
        );
      })}
    </span>
  );
};