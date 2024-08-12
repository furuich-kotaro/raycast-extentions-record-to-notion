import { useState, useEffect } from "react";
import {
  Form,
  ActionPanel,
  Action,
  Clipboard,
  showToast,
  Toast,
  launchCommand,
  LaunchType,
  PopToRootType,
  closeMainWindow,
  open,
} from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import {
  extractPageTitle,
  formatPageTitle,
  pageToClipboardText,
  // formatPageTitleForObsidian,
  buildSearchParams,
  pageCreateRequestParams,
  wasteTimeCategoryOptions,
  activityCategoryOptions,
  effectivityOptions,
  databaseId,
  notionClient,
  timeProperty,
} from "../lib/notion";
import { createInterval } from "../lib/intervals";
import { pageObject, FormValues } from "../lib/types";

export default function Command() {
  const [creating, setCreating] = useState(false);
  const [postLog, setPostLog] = useState("");
  const [latestPage, setLatestPage] = useState({} as pageObject);

  function launchSelfTimer() {
    try {
      launchCommand({
        name: "check-task-timer",
        type: LaunchType.UserInitiated,
      });
    } catch (error) {
      console.error(error);
    }
  }

  function launchObsidian(input: string) {
    try {
      const encodedInput = encodeURIComponent(JSON.stringify({ text: input }));
      open(
        `raycast://extensions/KevinBatdorf/obsidian/dailyNoteAppendCommand?launchType=userInitiated&arguments=${encodedInput}`,
      );
    } catch (error) {
      console.error(error);
    }
  }

  function calculateMinutes(startMinutes: string, endMinutes: string) {
    const start = Math.abs(Number(startMinutes));
    const end = Math.abs(Number(endMinutes));
    return end - start;
  }

  function getDifferenceInMinutes(dateString: string) {
    const inputTime = new Date(dateString).getTime();
    const currentTime = new Date().getTime();
    const differenceInMilliseconds = currentTime - inputTime;
    const differenceInMinutes = Math.floor(differenceInMilliseconds / 60000);

    return differenceInMinutes;
  }

  const { handleSubmit, itemProps, setValue } = useForm<FormValues>({
    onSubmit(values) {
      if (creating) {
        return;
      }
      setCreating(true);
      showToast({ style: Toast.Style.Animated, title: "Creating the page..." });

      notionClient
        .post(`/pages`, pageCreateRequestParams(values))
        .then((res) => {
          showToast({ style: Toast.Style.Success, title: "success" });

          const page = res.data;

          if (values.continueRegister) {
            setPostLog((before_value) => `${before_value}\n${formatPageTitle(page)}`);
          } else {
            const taskMinutes = calculateMinutes(values.start_minutes, values.end_minutes);
            if (taskMinutes > 0) {
              createInterval(taskMinutes);
              launchSelfTimer();
            }
            closeMainWindow({ popToRootType: PopToRootType.Immediate });
            Clipboard.copy(pageToClipboardText(page));
            // launchObsidian(formatPageTitleForObsidian(page));
          }
        })
        .catch((error) => {
          console.error(JSON.stringify(error.response.data, null, 2));
          showToast({ style: Toast.Style.Failure, title: "bad inputs" });
        })
        .finally(() => {
          setCreating(false);
        });
    },
    initialValues: {
      title: "",
      start_minutes: "0",
      end_minutes: "30",
      effectivity: "B",
      wasteTimeCategory: "",
      activityCategory: "",
      reflection: "",
      continueRegister: false,
    },
    validation: {
      title: FormValidation.Required,
      start_minutes: (value) => {
        if (!value) {
          return "必須";
        } else if (value && isNaN(Number(value))) {
          return "数字のみ";
        } else if (parseInt(value) > 0) {
          return "0以下";
        }
      },
      end_minutes: (value) => {
        if (!value) {
          return "必須";
        } else if (value && isNaN(Number(value))) {
          return "数字のみ";
        } else if (parseInt(value) < 0) {
          return "0以上";
        }
      },
    },
  });

  function fetchLatestPages() {
    const params = buildSearchParams();
    notionClient
      .post(`/databases/${databaseId}/query`, params)
      .then((res) => {
        const pages = res.data.results;
        const titles = pages
          .map((page: any) => formatPageTitle(page))
          .reverse()
          .join("\n");
        setPostLog(titles);
        setLatestPage(pages[0]);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    fetchLatestPages();
  }, []);

  return (
    <Form
      isLoading={creating}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Create the Page" />
          <Action
            title="Set New Timer"
            autoFocus={true}
            onAction={() =>
              launchCommand({
                type: LaunchType.UserInitiated,
                name: "set-custom-timer",
              })
            }
          />
        </ActionPanel>
      }
    >
      <Form.Checkbox
        id="setTimer"
        label="15分のタイマーをセット"
        defaultValue={false}
        onChange={(newValue) => {
          if (newValue) {
            createInterval(15);
            closeMainWindow({ popToRootType: PopToRootType.Immediate });
          }
        }}
      />
      <Form.TextField title="タイトル" {...itemProps.title} />
      <Form.TextField title="開始" {...itemProps.start_minutes} />
      <Form.TextField title="作業時間" {...itemProps.end_minutes} />
      {latestPage?.properties && (
        <>
          <Form.Checkbox
            id="updateNow"
            label="前回のログ完了から記録"
            defaultValue={false}
            onChange={(newValue) => {
              if (newValue) {
                const end_minutes = latestPage?.properties[timeProperty]?.date?.end;
                const minutes = getDifferenceInMinutes(end_minutes);

                setValue("start_minutes", `-${minutes.toString()}`);
                setValue("end_minutes", minutes.toString());
              }
            }}
          />
          <Form.Checkbox
            id="copyLatestLog"
            label="直近のログをコピー"
            defaultValue={false}
            onChange={(newValue) => {
              if (newValue) {
                setValue("title", extractPageTitle(latestPage));
              }
            }}
          />
        </>
      )}
      <Form.Dropdown title="効果" {...itemProps.effectivity}>
        {Object.keys(effectivityOptions).map((key: string) => (
          <Form.Dropdown.Item
            key={key}
            value={key}
            title={effectivityOptions[key as keyof typeof effectivityOptions]}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown title="時間分類" {...itemProps.wasteTimeCategory}>
        <Form.Dropdown.Item key="blank-wasteTimeCategory" value="" title="選択してください" />
        {wasteTimeCategoryOptions.map((value, index) => (
          <Form.Dropdown.Item key={`${index}-wasteTimeCategory`} value={value} title={value} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown title="カテゴリ" {...itemProps.activityCategory}>
        <Form.Dropdown.Item key="blank-activityCategory" value="" title="選択してください" />
        {Object.entries(activityCategoryOptions).map(([section, values], i) => (
          <Form.Dropdown.Section key={`${i}-activityCategory`} title={section}>
            {values.map((value, ii) => (
              <Form.Dropdown.Item key={`${i}-${ii}-activityCategory`} value={value} title={value} />
            ))}
          </Form.Dropdown.Section>
        ))}
      </Form.Dropdown>

      <Form.TextArea title="振り返り" {...itemProps.reflection} />
      <Form.Checkbox label="引き続き登録する" {...itemProps.continueRegister} />
      <Form.Separator />
      <Form.TextArea id="pastLog" title="過去ログ" value={postLog} onChange={() => {}} />
    </Form>
  );
}
