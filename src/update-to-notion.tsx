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
} from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import {
  formatMinutes,
  formatPageTitle,
  pageToClipboardText,
  buildSearchParams,
  pageUpdateRequestParams,
  wasteTimeCategoryOptions,
  activityCategoryOptions,
  effectivityOptions,
  databaseId,
  notionClient,
  reflectionProperty,
  effectivityProperty,
  wasteTimeCategoryProperty,
  activityCategoryProperty,
  titleProperty,
  timeProperty,
} from "../lib/notion";
import { createInterval } from "../lib/intervals";
import { FormValues } from "../lib/types";

export default function Command() {
  const [updating, setUpdating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pages, setPages] = useState([]);

  function isInValidDateFormat(dateString: string) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    return !regex.test(dateString);
  }

  const { handleSubmit, itemProps, setValue } = useForm<FormValues>({
    onSubmit(values) {
      showToast({ style: Toast.Style.Animated, title: "Updating the page..." });
      setUpdating(true);

      notionClient
        .patch(`/pages/${values.pageId}`, pageUpdateRequestParams(values))
        .then((res) => {
          showToast({ style: Toast.Style.Success, title: "success" });

          Clipboard.copy(pageToClipboardText(res.data));

          if (!values.continueUpdate) {
            launchCommand({
              type: LaunchType.UserInitiated,
              name: "record-to-notion",
            });
          }
        })
        .catch((error) => {
          console.error(JSON.stringify(error.response.data, null, 2));
          showToast({ style: Toast.Style.Failure, title: "bad inputs" });
        })
        .finally(() => {
          setUpdating(false);
        });
    },
    validation: {
      title: FormValidation.Required,
      start_minutes: (value) => {
        if (!value) {
          return "必須";
        } else if (value && isInValidDateFormat(value)) {
          return "フォーマットエラー";
        }
      },
      end_minutes: (value) => {
        if (!value) {
          return "必須";
        } else if (value && isInValidDateFormat(value)) {
          return "フォーマットエラー";
        }
      },
    },
  });

  function handlePageChange(pages: any, pageId: string) {
    const page = pages.find((page: any) => page.id == pageId);
    const tmpReflection = page.properties[reflectionProperty].rich_text[0];
    const tmpEffectivity = page.properties[effectivityProperty].select;
    const tmpWastTimeCategory = page.properties[wasteTimeCategoryProperty].select;
    const tmpActivityCategory = page.properties[activityCategoryProperty].select;

    setValue("title", page.properties[titleProperty].title[0].plain_text);
    setValue("start_minutes", page.properties[timeProperty].date.start.substring(0, 16));
    setValue("end_minutes", page.properties[timeProperty].date.end.substring(0, 16));
    setValue("reflection", tmpReflection ? tmpReflection.plain_text : "");
    setValue("effectivity", tmpEffectivity ? tmpEffectivity.name : "");
    setValue("wasteTimeCategory", tmpWastTimeCategory ? tmpWastTimeCategory.name : "");
    setValue("activityCategory", tmpActivityCategory ? tmpActivityCategory.name : "");
    setValue("pageId", page.id);
  }

  function fetchLatestPages() {
    notionClient
      .post(`/databases/${databaseId}/query`, buildSearchParams())
      .then((res) => {
        setPages(res.data.results);

        const page = res.data.results[0];
        setValue("pageId", page.id);
        handlePageChange(res.data.results, page.id);
      })
      .catch((error) => {
        console.error(error);
        showToast({ style: Toast.Style.Failure, title: "bad inputs" });
      })
      .finally(() => {
        setPageLoading(false);
      });
  }

  useEffect(() => {
    fetchLatestPages();
  }, []);

  return (
    <Form
      isLoading={pageLoading || updating}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Update the Page" />
        </ActionPanel>
      }
    >
      {/* <Form.Checkbox
        id="setTimer"
        label="10分のタイマーをセット"
        defaultValue={false}
        onChange={(newValue) => {
          if (newValue) {
            createInterval(10);
            closeMainWindow({ popToRootType: PopToRootType.Immediate });
          }
        }}
      /> */}
      {!pageLoading && (
        <>
          <Form.Checkbox
            id="updateNow"
            label="現在時刻で更新"
            defaultValue={false}
            onChange={(newValue) => {
              if (newValue) {
                formatMinutes;
                setValue("end_minutes", formatMinutes(0).substring(0, 16));
              }
            }}
          />
          <Form.Dropdown
            title="ページ"
            {...itemProps.pageId}
            onChange={(newValue) => {
              handlePageChange(pages, newValue);
            }}
          >
            {pages.map((page: any) => (
              <Form.Dropdown.Item key={page.id} value={page.id} title={formatPageTitle(page)} />
            ))}
          </Form.Dropdown>
          <Form.TextField title="タイトル" {...itemProps.title} />
          <Form.TextArea title="振り返り" {...itemProps.reflection} />
          <Form.TextField title="開始" {...itemProps.start_minutes} />
          <Form.TextField title="作業時間" {...itemProps.end_minutes} />
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
          <Form.Checkbox label="引き続き更新する" {...itemProps.continueUpdate} />
        </>
      )}
    </Form>
  );
}
