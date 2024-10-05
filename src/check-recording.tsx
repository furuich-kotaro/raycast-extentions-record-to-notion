import { launchCommand, LaunchType } from "@raycast/api";
import { getCurrentInterval } from "../lib/intervals";
import { getInputtingFlag } from "../lib/inputtingFlag";

export default async function CheckRecoding() {
  const currentInterval = getCurrentInterval();
  const isInputting = getInputtingFlag;

  if (!currentInterval && !isInputting) {
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
