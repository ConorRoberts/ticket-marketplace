import { valibotResolver } from "@hookform/resolvers/valibot";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { eventType } from "common/schema";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import { Image } from "~/components/Image";
import { Form } from "~/components/ui/form";
import { FormControl, FormField, FormItem } from "~/components/ui/form";
import { useApi } from "~/utils/api/apiClient";
import { imageFormats } from "~/utils/imageFormats";
import { images } from "~/utils/images";

const ticketListingFormSchema = v.object({
  description: v.string(),
  quantity: v.string(),
  unitPriceDollars: v.string(),
  event: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    imageId: v.string(),
    type: v.picklist(eventType),
    date: v.custom<CalendarDate>(
      (value) => value instanceof CalendarDate && value.compare(today(getLocalTimeZone())) >= 0,
      "Must be a date in the future",
    ),
  }),
});

type TicketListingFormInputData = v.InferOutput<typeof ticketListingFormSchema>;

const getDefaultFormData = (): TicketListingFormInputData => {
  return {
    unitPriceDollars: "0",
    quantity: "1",
    description: "",
    event: {
      name: "",
      date: today(getLocalTimeZone()),
      type: "concert" as const,
      imageId: images.imageIds.placeholder.ticketListing,
    },
  };
};

const ticketListingFormOutputSchema = v.object({
  description: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
  event: v.object({
    name: v.string(),
    imageId: v.string(),
    type: v.picklist(eventType),
    date: v.date(),
  }),
});
type TicketListingFormOutputData = v.InferOutput<typeof ticketListingFormOutputSchema>;

const getOutputData = (values: TicketListingFormInputData): TicketListingFormOutputData => {
  return {
    ...values,
    unitPriceCents: Math.floor(Number.parseFloat(values.unitPriceDollars) * 100),
    quantity: Number.parseInt(values.quantity),
    event: {
      ...values.event,
      date: values.event.date.toDate(getLocalTimeZone()),
    },
  };
};

export const SellTicketModal: FC<{
  open: boolean;
  onOpenChange: (state: boolean) => void;
  onSubmit: (data: TicketListingFormOutputData) => void | Promise<void>;
  initialValue?: TicketListingFormInputData;
}> = (props) => {
  const form = useForm({
    defaultValues: props.initialValue ? props.initialValue : getDefaultFormData(),
    resolver: valibotResolver(ticketListingFormSchema),
  });
  const api = useApi();

  const imageUrl = images.optimizeId(form.getValues("event.imageId"), { width: 500 });

  return (
    <Modal size="xl" isOpen={props.open} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {props.initialValue ? "Edit Listing" : "Sell Tickets"}
            </ModalHeader>
            <ModalBody>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(async (values) => {
                    await props.onSubmit(getOutputData(values));

                    onClose();
                  })}
                  className="flex flex-col gap-4"
                >
                  {imageUrl && (
                    <div className="h-64 overflow-hidden">
                      <Image src={imageUrl} />
                    </div>
                  )}

                  <Input
                    label="Image"
                    type="file"
                    accept={imageFormats.join(",")}
                    onChange={async (e) => {
                      const files = e.target.files;

                      if (!files) {
                        toast.error("Error uploading image");
                        return;
                      }

                      const f = files[0];

                      if (!f) {
                        toast.error("Error uploading image");
                        return;
                      }

                      const response = await api.uploadImage.$post({ form: { file: f } });
                      const uploadResult = await response.json();

                      if (!uploadResult.success) {
                        toast.error("Error uploading image");
                        return;
                      }

                      form.setValue("event.imageId", uploadResult.data.imageId, { shouldTouch: true });
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="event.name"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Event Name"
                            {...field}
                            errorMessage={fieldState.error?.message}
                            isInvalid={Boolean(fieldState.error?.message)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event.date"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex flex-col ">
                        <FormControl>
                          <DatePicker
                            label="Event Date"
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            errorMessage={fieldState.error?.message}
                            isInvalid={Boolean(fieldState.error?.message)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPriceDollars"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Price ($CAD)"
                            {...field}
                            type="number"
                            errorMessage={fieldState.error?.message}
                            isInvalid={Boolean(fieldState.error?.message)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Quantity"
                            {...field}
                            type="number"
                            errorMessage={fieldState.error?.message}
                            isInvalid={Boolean(fieldState.error?.message)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="event.type"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Autocomplete
                            label="Event Type"
                            value={field.value}
                            onValueChange={field.onChange}
                            errorMessage={fieldState.error?.message}
                            isInvalid={Boolean(fieldState.error?.message)}
                          >
                            {eventType.map((e) => (
                              <AutocompleteItem key={e} value={e} className="capitalize">
                                {/* Capitalize */}
                                {e
                                  .split(" ")
                                  .map((word) => `${word[0]?.toUpperCase()}${word.slice(1)}`)
                                  .join(" ")}
                              </AutocompleteItem>
                            ))}
                          </Autocomplete>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <ModalFooter>
                    <Button
                      className="w-full"
                      color="primary"
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      isLoading={form.formState.isSubmitting}
                      onClick={() => {
                        const errors = form.formState.errors;

                        Object.entries(errors).map(([_k, v], i) => {
                          console.error(v);

                          if (i === 0 && v.message) {
                            toast.error(v.message);
                          }
                        });
                      }}
                    >
                      {props.initialValue ? "Save" : "Create"}
                    </Button>
                  </ModalFooter>
                </form>
              </Form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
