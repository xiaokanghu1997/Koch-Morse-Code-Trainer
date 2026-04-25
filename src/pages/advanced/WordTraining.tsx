import type { WordTrainingConfig } from "../../lib/types";
import { GenericTraining } from "../../components/GenericTraining";
import { getRandomWords } from "../../services/dataLoader";

// Props 接口
interface WordTrainingProps {
  config: WordTrainingConfig;
  onBack: () => void;
}

export const WordTraining = ({ config, onBack }: WordTrainingProps) => {
  return (
    <GenericTraining
      config={config}
      dataLoader={getRandomWords}
      inputPlaceholder="Input word here..."
      inputWidth="200px"
      idPrefix="word"
      tooltips={{
        start: "Press enter to start",
        next: "Press enter to confirm and move to next word",
        retry: "Press enter to retry",
        repeat: "Press period (.) to repeat",
      }}
      onBack={onBack}
    />
  );
};