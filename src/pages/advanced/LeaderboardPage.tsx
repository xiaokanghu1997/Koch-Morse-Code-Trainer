import { Text, makeStyles, tokens } from "@fluentui/react-components";
import { RibbonStarFilled } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useAdvancedStore } from "../../stores/advancedStore";
import { formatTimestamp } from "../../services/statisticalToolset";
import type { AdvancedRecord, AdvancedType } from "../../lib/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    height: "100%",
    padding: "12px 15px",
    gap: "6px",
    overflow: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "4px",
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
    paddingTop: "2px",
    paddingBottom: "3px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  table: {
    width: "96%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    display: "table",
    margin: "0 auto",
    marginTop: "2px",
    "& thead tr": {
      height: "19px",
      backgroundColor: tokens.colorNeutralBackground3Hover,
      borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    "& thead th": {
      height: "19px",
      padding: "0px",
      textAlign: "center",
      verticalAlign: "middle",
    },
    "& tbody tr": {
      height: "19px",
    },
    "& tbody td": {
      height: "19px",
      padding: "0px",
      textAlign: "center",
      verticalAlign: "middle",
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
  },
  tableHeader: {
    fontSize: "12.5px",
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: "normal",
    padding: "0px",
    display: "block",
    textAlign: "center",
    marginTop: "-2px",
  },
  tableText: {
    fontSize: "12.5px",
    lineHeight: "normal",
    padding: "0px",
    display: "block",
    textAlign: "center",
  },
  rankTop: {
    fontSize: tokens.fontSizeBase400,
    margin: "0 auto",
    display: "block",
    textAlign: "center",
  },
});

// 板块组件的 props 类型
interface LeaderboardSectionProps {
  title: string;
  records: AdvancedRecord[];
}

// 前三名的排名颜色
const RANK_COLORS = [
  tokens.colorPaletteMarigoldBackground1, 
  tokens.colorPaletteMarigoldBackground2, 
  tokens.colorPaletteMarigoldBackground3
];

// 单个板块的组件
const LeaderboardSection = ({ title, records }: LeaderboardSectionProps) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const sorted = [...records]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const rows: (AdvancedRecord | null)[] = [
    ...sorted,
    ...Array(Math.max(0, 10 - sorted.length)).fill(null),
  ];

  return (
    <div className={styles.section}>
      {/* 板块标题 */}
      <Text className={styles.sectionTitle}>{title}</Text>

      {/* 表格内容 */}
      <table className={styles.table}>
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "47%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>
              <Text className={styles.tableHeader}>
                {t("advanced.leaderboard.table.rank")}
              </Text>
            </th>
            <th>
              <Text className={styles.tableHeader}>
                {t("advanced.leaderboard.table.score")}
              </Text>
            </th>
            <th>
              <Text className={styles.tableHeader}>
                {t("advanced.leaderboard.table.date")}
              </Text>
            </th>
            <th>
              <Text className={styles.tableHeader}>
                {t("advanced.leaderboard.table.speed")}
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((record, index) =>
            record ? (
              <tr key={index}>
                <td>
                  {index < 3 ? (
                    <RibbonStarFilled
                      className={styles.rankTop}
                      style={{ color: RANK_COLORS[index] }}
                    />
                  ) : (
                    <Text className={styles.tableText}>{index + 1}</Text>
                  )}
                </td>
                <td><Text className={styles.tableText}>{record.score}</Text></td>
                <td><Text className={styles.tableText}>{formatTimestamp(record.timestamp, false)}</Text></td>
                <td><Text className={styles.tableText}>{record.charSpeed}</Text></td>
              </tr>
            ) : (
              <tr key={index}>
                <td>
                  {index < 3 ? (
                    <RibbonStarFilled
                      className={styles.rankTop}
                      style={{ color: RANK_COLORS[index] }}
                    />
                  ) : (
                    <Text className={styles.tableText}>{index + 1}</Text>
                  )}
                </td>
                <td><Text className={styles.tableText}></Text></td>
                <td><Text className={styles.tableText}></Text></td>
                <td><Text className={styles.tableText}></Text></td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

// 定义板块信息的常量数组
const SECTIONS: { type: AdvancedType; titleKey: string }[] = [
  { type: "word",     titleKey: "advanced.leaderboard.sections.word" },
  { type: "callsign", titleKey: "advanced.leaderboard.sections.callsign" },
  { type: "qtc",      titleKey: "advanced.leaderboard.sections.qtc" },
];

export const LeaderboardPage = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  const { word, callsign, qtc } = useAdvancedStore();

  const recordMap: Record<AdvancedType, AdvancedRecord[]> = {
    word,
    callsign,
    qtc,
  };

  return (
    <div className={styles.container}>
      {SECTIONS.map(({ type, titleKey }) => (
        <LeaderboardSection key={type} title={t(titleKey)} records={recordMap[type]} />
      ))}
    </div>
  );
};