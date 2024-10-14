import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import { Preferences, FormValues, pageObject } from "./types";

const preferences = getPreferenceValues<Preferences>();

export const databaseId: string = preferences.databaseId;
export const titleProperty: string = preferences.titleProperty;
export const timeProperty: string = preferences.timeProperty;
export const reflectionProperty: string = preferences.reflectionProperty;
export const effectivityProperty: string = preferences.effectivityProperty;
export const wasteTimeCategoryProperty: string = preferences.wasteTimeCategoryProperty;
export const activityCategoryProperty: string = preferences.activityCategoryProperty;
export const expectedWorkTimeProperty: string = preferences.expectedWorkTimeProperty;

export const wasteTimeCategoryOptions = [
  "浪費",
  "徒労時間（見返りがない時間）",
  "他人時間（他人がやっても問題ないことをしている時間）",
  "隙間時間（タスクの合間の無為な時間）",
  "邪魔時間（無駄話など予期せぬ邪魔に費やした時間）",
  "対処時間（不注意や準備不足により、必要より多く使ってしまった時間）",
  "過信時間（見積もりが甘かったせいで、タスクが進まなかった時間）",
];

export const effectivityOptions = {
  A: "Good",
  B: "Not bad",
  C: "Bod",
} as const;

export const activityCategoryOptions = {
  Work: [
    "開発(コーディング)",
    "開発(コーディング以外)",
    "改善作業",
    "調査タスク",
    "コードレビュー",
    "会議・打ち合わせ",
    "Slackやりとり",
    "雑務",
  ],
  Life: [
    "移動",
    "休憩",
    "生活時間",
    "睡眠",
    "運動",
    "娯楽(能動的)",
    "娯楽(受動的)",
    "雑談",
    "勉強",
    "読書",
    "振り返り・反省",
    "プライベート",
    "アウトドア",
  ],
  Other: ["不明"],
} as const;

export const notionClient = axios.create({
  baseURL: "https://api.notion.com/v1",
  headers: {
    Authorization: `Bearer ${preferences.notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  },
});

export function formatMinutes(minutesToAdd: number) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesToAdd);

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const timezoneOffset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
    .toString()
    .padStart(2, "0");
  const offsetMinutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, "0");
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";

  return `${year}-${month}-${day}T${hours}:${minutes}:00${offsetSign}${offsetHours}:${offsetMinutes}`;
}

function commonPageParams(values: FormValues, startMinutes: string, endMinutes: string) {
  const params = {
    parent: { database_id: databaseId },
    properties: {
      [titleProperty]: {
        title: [{ text: { content: values.title } }],
      },
      [timeProperty]: {
        date: {
          start: startMinutes,
          end: endMinutes,
        },
      },
      [reflectionProperty]: {
        rich_text: [{ text: { content: values.reflection } }],
      },
      [effectivityProperty]: {
        select: {
          name: values.effectivity,
        },
      },
      [expectedWorkTimeProperty]: {
        number: Number(values.end_minutes),
      },
    },
  };

  if (values.wasteTimeCategory.length > 0) {
    params.properties[wasteTimeCategoryProperty] = {
      select: {
        name: values.wasteTimeCategory,
      },
    };
  }

  if (values.activityCategory.length > 0) {
    params.properties[activityCategoryProperty] = {
      select: {
        name: values.activityCategory,
      },
    };
  }

  return params;
}

export function pageCreateRequestParams(values: FormValues) {
  const startMinutes = formatMinutes(Number(values.start_minutes));
  const endMinutes = formatMinutes(Number(values.start_minutes) + Number(values.end_minutes));
  return commonPageParams(values, startMinutes, endMinutes);
}

export function pageUpdateRequestParams(values: FormValues) {
  const startMinutes = `${values.start_minutes}:00.000+09:00`;
  const endMinutes = `${values.end_minutes}:00.000+09:00`;
  const params = commonPageParams(values, startMinutes, endMinutes);
  delete params.properties[expectedWorkTimeProperty];

  return params;
}

export function buildSearchParams(page_size: number = 5): any {
  const params = {
    filter: {
      and: [
        {
          property: timeProperty,
          date: { on_or_after: formatMinutes(-1440) },
        },
        {
          property: timeProperty,
          date: { before: formatMinutes(120) },
        },
      ],
    },
    sorts: [{ property: timeProperty, direction: "descending" }],
    page_size: page_size,
  };

  return params;
}

function formatPageStartEndTime(page: pageObject): string {
  const dateEvent = page.properties[timeProperty];
  const start_time = dateEvent.date.start.substring(11, 16);
  const end_time = dateEvent.date.end.substring(11, 16);
  return `${start_time} ~ ${end_time}`;
}

export function formatPageTitle(page: pageObject): string {
  const title = page.properties[titleProperty].title[0].plain_text;
  const time = formatPageStartEndTime(page);
  return `${title} ${time}`;
}

export function extractPageTitle(page: pageObject): string {
  return page.properties[titleProperty].title[0].plain_text;
}

export function pageToClipboardText(page: pageObject): string {
  const dateEvent = page.properties[timeProperty];
  const tmpReflection = page.properties[reflectionProperty].rich_text[0];

  const title = page.properties[titleProperty].title[0].plain_text;
  const time = formatPageStartEndTime(page);
  let reflection = tmpReflection ? tmpReflection.plain_text : "";

  const now = new Date();
  const iso8601Date = new Date(dateEvent.date.start);
  if (iso8601Date.getTime() > now.getTime()) {
    reflection = "## 達成基準\n" + reflection;
  } else {
    reflection = "## 振り返り\n" + reflection;
  }

  return `${time} ${title}\n\n${reflection}`;
}

export function formatPageTitleForObsidian(page: pageObject): string {
  const title = page.properties[titleProperty].title[0].plain_text;
  const time = formatPageStartEndTime(page);
  return `- ${time} ${title}`;
}

export const setActivityCategoryFromTitle = (
  setValue: <K extends keyof FormValues>(id: K, value: FormValues[K]) => void,
  title: string,
) => {
  const timer = setTimeout(() => {
    const lowerTitle = title.toLowerCase();
    if (/実装|開発|改善|修正/.test(lowerTitle)) {
      setValue("activityCategory", "開発(コーディング)");
    } else if (/動作確認|テスト|リリース/.test(lowerTitle)) {
      setValue("activityCategory", "開発(コーディング以外)");
    } else if (/調査|QA/.test(lowerTitle)) {
      setValue("activityCategory", "調査タスク");
    } else if (/レビュ|review|相談/.test(lowerTitle)) {
      setValue("activityCategory", "コードレビュー");
    } else if (/会議|打ち合わせ|MTG|定例|1on1/.test(lowerTitle)) {
      setValue("activityCategory", "会議・打ち合わせ");
    } else if (/slack返信/.test(lowerTitle)) {
      setValue("activityCategory", "Slackやりとり");
    } else if (/帰宅|移動|出勤/.test(lowerTitle)) {
      setValue("activityCategory", "移動");
    } else if (/休憩|昼/.test(lowerTitle)) {
      setValue("activityCategory", "休憩");
    } else if (/夕食|身支度|シャワ|風呂/.test(lowerTitle)) {
      setValue("activityCategory", "生活時間");
    } else if (/ランニング|運動|腹筋/.test(lowerTitle)) {
      setValue("activityCategory", "運動");
    } else if (/睡眠/.test(lowerTitle)) {
      setValue("activityCategory", "睡眠");
    } else if (/漫画|アニメ|youtube|tver|sns|tiktok/i.test(lowerTitle)) {
      setValue("activityCategory", "娯楽(受動的)");
    } else if (/振り返り|反省|ログ/.test(lowerTitle)) {
      setValue("activityCategory", "振り返り・反省");
    }
  }, 300);
  return () => clearTimeout(timer);
};
