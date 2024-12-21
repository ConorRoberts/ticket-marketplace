import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, Textarea } from "@nextui-org/react";
import { createId } from "@paralleldrive/cuid2";
import { useMutation } from "@tanstack/react-query";
import { produce } from "immer";
import { XIcon } from "lucide-react";
import { type FC, useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";

const formSchema = v.object({ body: v.string(), links: v.array(v.string()) });
type FormOutput = v.InferOutput<typeof formSchema>;

export const MerchantApplyModal: FC<{
  isOpen: boolean;
  onOpenChange: () => void;
  onSubmit: (data: FormOutput) => void | Promise<void>;
}> = (props) => {
  const [links, setLinks] = useState<{ id: string; value: string }[]>([{ id: createId(), value: "" }]);
  const { mutate: submit, isPending: isSubmitLoading } = useMutation({
    mutationFn: async (data: FormOutput) => {
      await props.onSubmit(data);
    },
  });

  const handleLinkValueChange = (id: string, value: string) => {
    setLinks(
      produce((state) => {
        const link = state.find((e) => e.id === id);

        if (!link) {
          return;
        }

        link.value = value;
      }),
    );
  };

  const handleLinkRemove = (id: string) => {
    setLinks((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
      <ModalContent>
        <ModalHeader>Request Permission to Sell Tickets</ModalHeader>
        <ModalBody className="mb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = new FormData(e.currentTarget);
              const groupedEntries = {
                ...Object.fromEntries(form.entries()),
                links: links.map((e) => e.value).filter(Boolean),
              };

              const valid = v.safeParse(formSchema, groupedEntries);

              if (!valid.success) {
                toast.error(valid.issues[0].message);
                return;
              }

              submit(valid.output);
            }}
            className="flex flex-col gap-4"
          >
            <Textarea
              name="body"
              label="Body"
              placeholder="Tell us a bit about yourself and your experience as a seller."
              validationBehavior="native"
              validate={(value) => (value.length > 0 ? true : "Body must not be empty.")}
            />
            <div className="flex flex-col gap-2">
              {/* <p className="font-medium text-sm">Social Media Links</p> */}
              <div className="flex flex-col gap-1">
                {links.map((e) => (
                  <SocialMediaLink
                    key={e.id}
                    value={e.value}
                    onValueChange={(value) => handleLinkValueChange(e.id, value)}
                    onRemove={() => handleLinkRemove(e.id)}
                  />
                ))}
              </div>
              {/* <Button
                isDisabled={links.length > 5}
                size="sm"
                variant="flat"
                endContent={<PlusIcon className="size-4" />}
                onClick={() =>
                  setLinks(
                    produce((state) => {
                      state.push({ id: createId(), value: "" });
                    }),
                  )
                }
              >
                Add Link
              </Button> */}
            </div>
            <Button type="submit" isLoading={isSubmitLoading} color="primary">
              Submit
            </Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const urlSchema = v.pipe(v.string(), v.url());

const validateUrl = (value: string) => {
  if (value.length === 0) {
    return true;
  }

  const valid = v.safeParse(urlSchema, value);

  if (!valid.success) {
    return "Must be a valid URL";
  }

  return true;
};

const SocialMediaLink: FC<{ onValueChange: (value: string) => void; onRemove: () => void; value: string }> = (
  props,
) => {
  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Instagram URL"
        value={props.value}
        onValueChange={props.onValueChange}
        type="url"
        validate={validateUrl}
        validationBehavior="native"
      />
      <Button variant="light" isIconOnly onClick={props.onRemove}>
        <XIcon className="size-4" />
      </Button>
    </div>
  );
};
