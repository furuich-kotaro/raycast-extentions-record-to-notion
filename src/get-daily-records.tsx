import { Action, ActionPanel, Form, Clipboard, showToast, Toast } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { format } from "date-fns";
import { useState } from "react";
import { databaseId, formatPagePropertiesForReflection, notionClient, timeProperty } from "../lib/notion";
import { pageObject } from "../lib/types";

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);

  const copyPages = (pages: pageObject[]) => {
    const logs = pages.map((page) => {
      return formatPagePropertiesForReflection(page);
    });

    Clipboard.copy(logs.join("\n----\n"));
  };

  const { handleSubmit, itemProps } = useForm<{ selectedDate: Date | null }>({
    async onSubmit(values) {
      try {
        setIsLoading(true);
        if (!(values.selectedDate instanceof Date)) {
          console.log("Selected date is required");
          return;
        }

        const startOfDay = format(values.selectedDate, "yyyy-MM-dd'T'00:00:00+09:00");
        const endOfDay = format(values.selectedDate, "yyyy-MM-dd'T'23:59:59+09:00");

        const params = {
          filter: {
            and: [
              {
                property: timeProperty,
                date: { on_or_after: startOfDay },
              },
              {
                property: timeProperty,
                date: { before: endOfDay },
              },
            ],
          },
          sorts: [{ property: timeProperty, direction: "ascending" }],
        };

        const response = await notionClient.post(`/databases/${databaseId}/query`, params);
        copyPages(response.data.results);
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
