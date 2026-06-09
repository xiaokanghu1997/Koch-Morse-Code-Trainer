import { useTranslation } from "react-i18next";
import type { CallsignTrainingConfig } from "../../lib/types";
import { GenericTraining } from "../../components/GenericTraining";
import { getRandomCallsigns } from "../../services/contentGenerator";

// Props 接口
interface CallsignTrainingProps {
  config: CallsignTrainingConfig;
  onBack: () => void;
}

export const CallsignTraining = ({ config, onBack }: CallsignTrainingProps) => {
  const { t } = useTranslation();

  return (
    <GenericTraining
      config={config}
      dataLoader={getRandomCallsigns}
      inputPlaceholder={t("advanced.callsign.training.inputPlaceholder")}
      inputWidth="220px"
      inputMaxLength={13}
      idPrefix="callsign"
      tooltips={{
        start: t("advanced.callsign.training.tooltips.start"),
        next: t("advanced.callsign.training.tooltips.next"),
        retry: t("advanced.callsign.training.tooltips.retry"),
        repeat: t("advanced.callsign.training.tooltips.repeat"),
      }}
      blindMode={config.blindMode}
      onBack={onBack}
    />
  );
};