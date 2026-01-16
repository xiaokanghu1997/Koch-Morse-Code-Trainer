import { TitleBar } from "../components/TitleBar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  NavDrawer,
  NavDrawerHeader,
  NavDrawerBody,
  NavDrawerFooter,
  NavItem,
  Tooltip,
} from "@fluentui/react-components";
import { makeStyles, tokens } from "@fluentui/react-components";
import {
  Voicemail20Filled,
  Voicemail20Regular,
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
    borderRadius: "10px",
    border: `1.5px solid ${tokens.colorNeutralStroke1}`
  },
  mainContent: {
    display: "flex",
    flex: "1",
    overflow: "hidden",
  },
  nav: {
    width: "36px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  content: {
    flex: "1",
    padding: "10px",
    overflow: "auto",
    backgroundColor: tokens.colorNeutralBackground2,
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
    backgroundColor: tokens.colorNeutralBackground1,
    transitionProperty: "none",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
    },
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground1Hover,
    boxShadow: tokens.shadow2,
  },
});

const Training = bundleIcon(Voicemail20Filled, Voicemail20Regular);
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
              <Tooltip
                content={{
                  children: "Training",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<Training />} value="/training" />
              </Tooltip>
              <Tooltip
                content={{
                  children: "Activity",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<Activity />} value="/activity" />
              </Tooltip>
              <Tooltip
                content={{
                  children: "Statistics",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<Statistics />} value="/statistics" />
              </Tooltip>
              <Tooltip
                content={{
                  children: "Generator",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<Generator />} value="/generator" />
              </Tooltip>
            </NavDrawerBody>

            <NavDrawerFooter className={styles.navBody}>
              <Tooltip
                content={{
                  children: "About",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<About />} value="/about" />
              </Tooltip>
              <Tooltip
                content={{
                  children: "Settings",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="after"
              >
                <NavItem className={styles.navItem} icon={<Settings />} value="/settings" />
              </Tooltip>
            </NavDrawerFooter>
          </NavDrawer>

          <div className={styles.content}>
              <Outlet />
          </div>
      </div>
    </div>
  );
};