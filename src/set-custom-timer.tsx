import { useForm } from "@raycast/utils";
import { Form, ActionPanel, Action, launchCommand, LaunchType, closeMainWindow, showHUD } from "@raycast/api";

import { createInterval } from "../lib/intervals";

const launchSelfTimer = () => () => {
  try {
    launchCommand({
      name: "check-task-timer",
      type: LaunchType.UserInitiated,
    });
  } catch (error) {
    console.error(error);
  }
};

type FormValues = {
  minutes: string;
};

export default function Command() {
  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit(values) {
      const minutes = parseInt(values.minutes);
      createInterval(minutes);
      launchSelfTimer();
      closeMainWindow();
      showHUD("タイマーをセットしました⌛");
    },
    validation: {
      minutes: (value) => {
        if (!value) {
          return "入力してください。";
        } else if (value && parseInt(value) < 1) {
          return "0以上の整数を入力してください";
        }
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Set Timer" />
        </ActionPanel>
      }
    >
      <Form.TextField title="時間" {...itemProps.minutes} />
    </Form>
  );
}
