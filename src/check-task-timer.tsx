import { MenuBarExtra, launchCommand, LaunchType } from "@raycast/api";
import { useState } from "react";
import { getCurrentInterval, resetInterval, Interval, duration, progress } from "../lib/intervals";
import { secondsToTime } from "../lib/secondsToTime";

export default function CheckTaskTimer() {
  const [currentInterval, setCurrentInterval] = useState<Interval | undefined>(getCurrentInterval());

  if (currentInterval && progress(currentInterval) >= 100) {
    try {
      launchCommand({
        type: LaunchType.UserInitiated,
        name: "update-to-notion",
      });

    } catch (error) {
      console.error(error);
    }

    resetInterval();
  }

  function onReset() {
    resetInterval();
    setCurrentInterval(undefined);
  }

  function setCustomInterval() {
    launchCommand({
      type: LaunchType.UserInitiated,
      name: "set-custom-timer",
    });
  }

  const title = currentInterval ? secondsToTime(currentInterval.length - duration(currentInterval)) : "--:--";

  return (
    <MenuBarExtra title={title}>
      {currentInterval ? (
        <>
          <MenuBarExtra.Item title="Reset" onAction={onReset} shortcut={{ modifiers: ["cmd"], key: "r" }} />
          <MenuBarExtra.Item
            title="Set Custom Timer"
            onAction={setCustomInterval}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </>
      ) : (
        <>
          <MenuBarExtra.Item
            title="Set Custom Timer"
            onAction={setCustomInterval}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </>
      )}
    </MenuBarExtra>
  );
}
