import { Action, ActionPanel, Form, Clipboard, showToast, Toast } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { format } from "date-fns";
import { useState } from "react";
import {
  databaseId,
  formatPagePropertiesForReflection,
  notionClient,
  timeProperty,
  activityCategoryOptions,
  activityCategoryProperty,
} from "../lib/notion";
import { pageObject } from "../lib/types";

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);

  const copyPages = (pages: pageObject[]) => {
    const groupedPages: { [key: string]: pageObject[] } = {
      Work: [],
      Personal: [],
    };

    pages.forEach((page) => {
      const category = page.properties[activityCategoryProperty]?.select?.name;
      if (category) {
        if (activityCategoryOptions.Work.includes(category)) {
          groupedPages.Work.push(page);
        } else {
          groupedPages.Personal.push(page);
        }
      } else {
        groupedPages.Personal.push(page);
      }
    });

    const formattedGroups = Object.entries(groupedPages)
      .filter(([, pages]) => pages.length > 0)
      .map(([category, pages]) => {
        const formattedPages = pages.map((page) => formatPagePropertiesForReflection(page)).join("\n----\n");
        return `## ${category}\n${formattedPages}`;
      })
      .join("\n\n\n");

    Clipboard.copy(formattedGroups);
  };

  const filterPages = (pages: pageObject[], selectedDate: string) => {
    return pages.filter((page: pageObject) => {
      const startDate = new Date(page.properties[timeProperty].date.start);
      const endDate = page.properties[timeProperty].date.end ? new Date(page.properties[timeProperty].date.end) : null;

      if (startDate && endDate) {
        return format(startDate, "yyyy-MM-dd") === selectedDate || format(endDate, "yyyy-MM-dd") === selectedDate;
      } else if (startDate) {
        return format(startDate, "yyyy-MM-dd") === selectedDate;
      }
    });
  };

  const { handleSubmit, itemProps } = useForm<{ selectedDate: Date | null }>({
    async onSubmit(values) {
      try {
        setIsLoading(true);
        const selectedDate = values.selectedDate;
        if (!(selectedDate instanceof Date)) {
          console.log("Selected date is required");
          return;
        }

        const startOfDay = format(
          new Date(new Date(selectedDate).setHours(0, 0, 0, 0) - 3 * 60 * 60 * 1000),
          "yyyy-MM-dd'T'HH:mm:00+09:00",
        );

        const params = {
          filter: {
            and: [
              {
                property: timeProperty,
                date: { on_or_after: startOfDay },
              },
              {
                property: timeProperty,
                date: { before: format(selectedDate, "yyyy-MM-dd'T'23:59:59+09:00") },
              },
            ],
          },
          sorts: [{ property: timeProperty, direction: "ascending" }],
        };

        const response = await notionClient.post(`/databases/${databaseId}/query`, params);
        const pages = filterPages(response.data.results, format(selectedDate, "yyyy-MM-dd"));
        copyPages(pages);
        showToast({
          style: Toast.Style.Success,
          title: "Success",
          message: "Records fetched successfully",
        });
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch records",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    },
    initialValues: {
      selectedDate: new Date(),
    },
    validation: {
      selectedDate: FormValidation.Required,
    },
  });

  return (
    <>
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <Action.SubmitForm onSubmit={handleSubmit} title="Get Records" />
          </ActionPanel>
        }
      >
        <Form.DatePicker title="Select Date" type={Form.DatePicker.Type.Date} {...itemProps.selectedDate} />
      </Form>
    </>
  );
}
