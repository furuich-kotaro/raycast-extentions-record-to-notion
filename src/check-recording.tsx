import { launchCommand, LaunchType, showToast, Toast } from "@raycast/api";
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
      showToast({ style: Toast.Style.Failure, title: "Failed to launch record-to-notion" });
    }
  }
}
