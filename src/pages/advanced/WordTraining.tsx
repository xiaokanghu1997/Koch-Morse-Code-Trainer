import { useTranslation } from "react-i18next";
import type { WordTrainingConfig } from "../../lib/types";
import { GenericTraining } from "../../components/GenericTraining";
import { getRandomWords } from "../../services/contentGenerator";

// Props 接口
interface WordTrainingProps {
  config: WordTrainingConfig;
  onBack: () => void;
}

export const WordTraining = ({ config, onBack }: WordTrainingProps) => {
  const { t } = useTranslation();

  return (
    <GenericTraining
      config={config}
      dataLoader={getRandomWords}
      inputPlaceholder={t("advanced.word.training.inputPlaceholder")}
      inputWidth="200px"
      inputMaxLength={14}
      idPrefix="word"
      tooltips={{
        start: t("advanced.word.training.tooltips.start"),
        next: t("advanced.word.training.tooltips.next"),
        retry: t("advanced.word.training.tooltips.retry"),
        repeat: t("advanced.word.training.tooltips.repeat"),
      }}
      onBack={onBack}
    />
  );
};