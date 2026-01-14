import { TitleBar } from "../components/TitleBar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  NavDrawer,
  NavDrawerHeader,
  NavDrawerBody,
  NavDrawerFooter,
  NavItem,
} from "@fluentui/react-components";
import { makeStyles, Tooltip, tokens } from "@fluentui/react-components";
import {
  HeadphonesSoundWave20Filled,
  HeadphonesSoundWave20Regular,
  CalendarLtr20Filled,
  CalendarLtr20Regular,
  DataHistogram20Filled,
  DataHistogram20Regular,
  ContentSettings20Filled,
  ContentSettings20Regular,
  Info20Filled,
  Info20Regular,
  Settings20Filled,
  Settings20Regular,
  bundleIcon,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root:  {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  mainContent: {
    display: "flex",
    flex: "1",
    overflow: "hidden",
  },
  nav: {
    width: "36px",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  content: {
    flex: "1",
    padding: "20px",
    overflow: "auto",
  },
  emptyHeader: {
    height: "0",
    padding: "0",
  },
  navBody: {
    padding: "4px 4px",
  },
  navItem: {
    padding: "8px 4px",
    "& svg": {
        pointerEvents: "none",
    },
    backgroundColor: tokens.colorNeutralBackground2,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
});

const Training = bundleIcon(HeadphonesSoundWave20Filled, HeadphonesSoundWave20Regular);
const Activity = bundleIcon(CalendarLtr20Filled, CalendarLtr20Regular);
const Statistics = bundleIcon(DataHistogram20Filled, DataHistogram20Regular);
const Generator = bundleIcon(ContentSettings20Filled, ContentSettings20Regular);
const About = bundleIcon(Info20Filled, Info20Regular);
const Settings = bundleIcon(Settings20Filled, Settings20Regular);

export const MainLayout = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前选中的值（现在直接返回路径）
  const getSelectedValue = () => {
    return location.pathname;
  };

  return (
    <div className={styles.root}>
        <TitleBar />
    
        <div className={styles.mainContent}>
          <NavDrawer
            selectedValue={getSelectedValue()}
            onNavItemSelect={(_, data) => navigate(data.value as string)}
            open={true}
            type="inline"
            className={styles.nav}
          >
            <NavDrawerHeader className={styles.emptyHeader} />

            <NavDrawerBody className={styles.navBody}>
              <NavItem className={styles.navItem} icon={<Training />} value="/training" />
              <NavItem className={styles.navItem} icon={<Activity />} value="/activity" />
              <NavItem className={styles.navItem} icon={<Statistics />} value="/statistics" />
              <NavItem className={styles.navItem} icon={<Generator />} value="/generator" />
            </NavDrawerBody>

            <NavDrawerFooter className={styles.navBody}>
              <NavItem className={styles.navItem} icon={<About />} value="/about" />
              <NavItem className={styles.navItem} icon={<Settings />} value="/settings" />
            </NavDrawerFooter>
          </NavDrawer>

          <div className={styles.content}>
              <Outlet />
          </div>
      </div>
    </div>
  );
};