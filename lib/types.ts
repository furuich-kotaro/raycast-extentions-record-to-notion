export type Preferences = {
  notionToken: string;
  databaseId: string;
  titleProperty: string;
  timeProperty: string;
  reflectionProperty: string;
  effectivityProperty: string;
  wasteTimeCategoryProperty: string;
  activityCategoryProperty: string;
  expectedWorkTimeProperty: string;
  tensionProperty: string;
};

export type FormValues = {
  pageId: string;
  title: string;
  start_minutes: string;
  end_minutes: string;
  effectivity: string;
  wasteTimeCategory: string;
  activityCategory: string;
  reflection: string;
  tension: string;
  continueRegister: boolean;
  continueUpdate: boolean;
};

export type pageObject = {
  object: string;
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  cover: any;
  icon: {
    type: string;
    [key: string]: any;
  } | null;
  parent: {
    type: string;
    [key: string]: any;
  };
  archived: boolean;
  properties: any;
  url: string;
  public_url: string;
};
