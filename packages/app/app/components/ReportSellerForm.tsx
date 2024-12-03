import { Button, Textarea } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/select";
import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { toast } from "sonner";
import * as v from "valibot";

const reportReasons = ["Scamming", "Abusive language", "Other"];

const reportFormSchema = v.object({ reason: v.string(), description: v.string() });

type ReportFormOutput = v.InferOutput<typeof reportFormSchema>;

export const ReportSellerForm: FC<{ onSubmit: (data: ReportFormOutput) => void | Promise<void> }> = (props) => {
  const { mutateAsync: submit, isPending } = useMutation({
    mutationFn: async (data: ReportFormOutput) => {
      await props.onSubmit(data);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const form = new FormData(e.currentTarget);

        const valid = v.safeParse(reportFormSchema, Object.fromEntries(form.entries()));

        if (!valid.success) {
          toast.error("Invalid form data");
          return;
        }

        submit(valid.output);
      }}
      className="flex flex-col gap-4"
    >
      <Select label="Reason for report" isRequired name="reason">
        {reportReasons.map((reason) => (
          <SelectItem key={reason}>{reason}</SelectItem>
        ))}
      </Select>
      <Textarea label="Description" name="description" minLength={1} />
      <Button type="submit" color="primary" isLoading={isPending}>
        Submit
      </Button>
    </form>
  );
};
