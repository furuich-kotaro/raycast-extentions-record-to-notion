import { launchCommand, LaunchType, showHUD } from "@raycast/api";
import { getCurrentInterval } from "../lib/intervals";

export default async function CheckRecoding() {
  const currentInterval = getCurrentInterval();

  if (!currentInterval) {
    try {
      await launchCommand({
        type: LaunchType.UserInitiated,
        name: "record-to-notion",
      });

    } catch (error) {
      console.error(error);
    }
  }
}
