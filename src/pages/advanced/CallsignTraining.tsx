import type { CallsignTrainingConfig } from "../../lib/types";
import { GenericTraining } from "../../components/GenericTraining";
import { getRandomCallsigns } from "../../services/dataLoader";

// Props 接口
interface CallsignTrainingProps {
  config: CallsignTrainingConfig;
  onBack: () => void;
}

export const CallsignTraining = ({ config, onBack }: CallsignTrainingProps) => {
  return (
    <GenericTraining
      config={config}
      dataLoader={getRandomCallsigns}
      inputPlaceholder="Input callsign here..."
      inputWidth="220px"
      idPrefix="callsign"
      tooltips={{
        start: "Press enter to start",
        next: "Press enter to confirm and move to next callsign",
        retry: "Press enter to retry",
        repeat: "Press period (.) to repeat",
      }}
      blindMode={config.blindMode}
      onBack={onBack}
    />
  );
};