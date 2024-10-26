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
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { omit } from "remeda";
import { toast } from "sonner";
import * as v from "valibot";
import { Image } from "~/components/Image";
import { Form } from "~/components/ui/form";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { api } from "~/utils/api/apiClient";
import { createTicketListingInputSchema } from "~/utils/createTicketListingInputSchema";
import { images } from "~/utils/images";
import { useLocalImageUrl } from "~/utils/useLocalImageUrl";

const ticketListingFormSchema = v.object({
  ...v.omit(createTicketListingInputSchema, ["event"]).entries,
  event: v.object({
    ...v.omit(createTicketListingInputSchema.entries.event, ["imageId"]).entries,
    date: v.custom<CalendarDate>((value) => value instanceof CalendarDate),
  }),
});

type SellTicketFormData = v.InferOutput<typeof ticketListingFormSchema>;

const getDefaultFormData = (): SellTicketFormData => {
  return {
    priceCents: 0.0,
    quantity: 1,
    description: "",
    event: {
      name: "",
      date: today(getLocalTimeZone()),
      type: "concert" as const,
    },
  };
};

const getOutputData = (values: SellTicketFormData & { imageId: string }) => {
  return {
    ...omit(values, ["imageId"]),
    priceCents: values.priceCents * 100,
    event: {
      ...values.event,
      date: values.event.date.toDate(getLocalTimeZone()),
      imageId: values.imageId,
    },
  };
};

type FormOutputData = ReturnType<typeof getOutputData>;

export const SellTicketModal: FC<{
  open: boolean;
  onOpenChange: (state: boolean) => void;
  onSubmit: (data: FormOutputData) => void | Promise<void>;
  initialValue?: SellTicketFormData & { event: SellTicketFormData["event"] & { imageId: string } };
}> = (props) => {
  const form = useForm({
    defaultValues: props.initialValue
      ? {
          ...omit(props.initialValue, ["event"]),
          event: omit(props.initialValue.event, ["imageId"]),
        }
      : getDefaultFormData(),
    resolver: valibotResolver(ticketListingFormSchema),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const uploadedImageUrl = useLocalImageUrl(imageFile);
  const imageUrl = props.initialValue
    ? images.optimizeId(props.initialValue.event.imageId, { width: 500 })
    : uploadedImageUrl;

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
                    let imageId: string | null = null;

                    if (imageFile) {
                      const res = await api.uploadImage.$post({ form: { file: imageFile } });
                      const uploadResult = await res.json();

                      if (!uploadResult.success) {
                        console.error(uploadResult.data.message);
                        toast.error("Error uploading image");
                        return;
                      }

                      imageId = uploadResult.data.imageId;
                    } else if (props.initialValue?.event.imageId) {
                      imageId = props.initialValue?.event.imageId;
                    }

                    if (!imageId) {
                      toast.error("Image is required");
                      return;
                    }

                    await props.onSubmit(getOutputData({ ...values, imageId }));

                    onClose();
                  })}
                  className="flex flex-col gap-4"
                >
                  <Input
                    label="Image"
                    type="file"
                    onChange={(e) => {
                      const files = e.target.files;

                      if (!files) {
                        return;
                      }

                      const f = files[0];

                      if (!f) {
                        return;
                      }

                      setImageFile(f);
                    }}
                  />

                  {imageUrl && (
                    <div className="h-64 overflow-hidden">
                      <Image src={imageUrl} />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="event.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Event Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event.date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col ">
                        <FormControl>
                          <DatePicker
                            label="Event Date"
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Price ($CAD)" {...field} value={String(field.value)} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Quantity" {...field} value={String(field.value)} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="event.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Autocomplete label="Event Type" value={field.value} onValueChange={field.onChange}>
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
                        <FormMessage />
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
