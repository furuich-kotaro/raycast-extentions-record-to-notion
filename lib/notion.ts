import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import {
  Preferences,
  FormValues,
} from "./types";

const preferences = getPreferenceValues<Preferences>();

export const databaseId: string = preferences.databaseId
export const titleProperty: string = preferences.titleProperty
export const timeProperty: string = preferences.timeProperty
export const reflectionProperty: string = preferences.reflectionProperty
export const effectivityProperty: string = preferences.effectivityProperty
export const categoryProperty: string = preferences.categoryProperty
export const expectedWorkTimeProperty: string = preferences.expectedWorkTimeProperty

export const categoryOptions = [
  "浪費",
  "徒労時間（見返りがない時間）",
  "他人時間（他人がやっても問題ないことをしている時間）",
  "隙間時間（タスクの合間の無為な時間）",
  "邪魔時間（無駄話など予期せぬ邪魔に費やした時間）",
  "対処時間（不注意や準備不足により、必要より多く使ってしまった時間）",
  "過信時間（見積もりが甘かったせいで、タスクが進まなかった時間）",
  "",
];

export const effectivityOptions = {
  "A": "Good",
  "B": "Not bad",
  "C": "Bod",
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

export function buildRequestParams(values: FormValues) {
  const start_minutes = formatMinutes(Number(values.start_minutes));
  const end_minutes = formatMinutes(Number(values.start_minutes) + Number(values.end_minutes));
  const params = {
    parent: { database_id: databaseId },
    properties: {
      [titleProperty]: {
        title: [{ text: { content: values.title } }],
      },
      [timeProperty]: {
        date: {
          start: start_minutes,
          end: end_minutes,
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

  if (values.category.length > 0) {
    params.properties[categoryProperty] = {
      select: {
        name: values.category,
      },
    };
  }

  return params;
}

export function pageUpdateRequestParams(values: FormValues) {
  const start_minutes = `${values.start_minutes}:00.000+09:00`
  const end_minutes = `${values.end_minutes}:00.000+09:00`

  const params = {
    parent: { database_id: databaseId },
    properties: {
      [titleProperty]: {
        title: [
          { text: { content: values.title } }
        ]
      },
      [timeProperty]: {
        date: {
          start: start_minutes,
          end: end_minutes
        }
      },
      [reflectionProperty]: {
        rich_text : [
          { text: { content: values.reflection } }
        ]
      },
      [effectivityProperty]: {
        select: {
          name: values.effectivity
        }
      }
    }
  }

  if (values.category.length > 0) {
    params.properties[categoryProperty] = {
      select: {
        name: values.category,
      },
    };
  }

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
    sorts: [ { property: timeProperty, direction: "descending" }],
    page_size: page_size
  }

  return params;
}

export function formatPageTitle(page: any): string {
  const title = page.properties[titleProperty].title[0].plain_text;
  const dateEvent = page.properties[timeProperty];
  const start_time = dateEvent.date.start.substring(11, 16)
  const end_time = dateEvent.date.end.substring(11, 16)
  return `${title} ${start_time} ~ ${end_time}`;
}

export function extractPageTitle(page: any): string {
  return page.properties[titleProperty].title[0].plain_text;
}

export function pageToClipboardText(page: any): string {
  const dateEvent = page.properties[timeProperty];
  const tmpReflection = page.properties[reflectionProperty].rich_text[0]

  const title = page.properties[titleProperty].title[0].plain_text;
  const start_time = dateEvent.date.start.substring(11, 16)
  const end_time = dateEvent.date.end.substring(11, 16)
  let reflection = tmpReflection ? tmpReflection.plain_text : "";

  const now = new Date();
  const iso8601Date = new Date(dateEvent.date.start);
  if (iso8601Date.getTime() > now.getTime()) {
    reflection = "## 達成基準\n" + reflection;
  } else {
    reflection = "## 振り返り\n" + reflection;
  }

  return `${start_time} ~ ${end_time} \n${title}\n\n${reflection}`;
}
