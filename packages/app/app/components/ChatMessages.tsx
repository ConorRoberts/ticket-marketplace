import { Modal, ModalBody, ModalContent, Textarea, useDisclosure } from "@nextui-org/react";
import type { ChatMessage } from "common/schema";
import { AnimatePresence, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowDownCircleIcon, ArrowRightIcon, ImageIcon, XIcon } from "lucide-react";
import { type FC, type PropsWithChildren, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { useWindowSize } from "usehooks-ts";
import { cn } from "~/utils/cn";
import { imageFormats } from "~/utils/imageFormats";
import { useUploadFiles } from "~/utils/useUploadFiles";
import { Image } from "./Image";

export const ChatMessages: FC<
  PropsWithChildren<{
    onMessageSend?: (data: { message: string; attachments: ChatMessage["attachments"] }) => void;
    messages: ChatMessage[];
    className?: string;
    bottomRef?: RefObject<HTMLDivElement>;
    containerRef?: RefObject<HTMLDivElement>;
    showNewMessage?: boolean;
    onNewMessageClick?: () => void;
    onScrollChange?: (event: React.UIEvent<HTMLDivElement, UIEvent>, additionalData: { isAtBottom: boolean }) => void;
  }>
> = (props) => {
  const scroll = useScroll(props.containerRef ? { container: props.containerRef } : undefined);
  const [side, setSide] = useState<"top" | "bottom" | "none" | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scroll.scrollYProgress.on("change", (value) => {
      const messagesHeight = messagesRef?.current?.clientHeight ?? 0;
      const containerHeight = props.containerRef?.current?.clientHeight ?? 0;

      const currentScrollValue = messagesHeight * value;
      const pixelThreshold = 100;

      if (messagesHeight < containerHeight) {
        setSide(null);
      } else {
        if (currentScrollValue < pixelThreshold) {
          setSide("top");
        } else if (messagesHeight - currentScrollValue < pixelThreshold) {
          setSide("bottom");
        } else {
          setSide("none");
        }
      }
    });
  }, [scroll, props.containerRef]);

  return (
    <div className={cn("flex flex-col flex-1 p-2 gap-2 isolate", props.className)}>
      <div className="flex flex-col gap-2 flex-1 relative overflow-hidden">
        <AnimatePresence>
          {(side === "bottom" || side === "none") && (
            <motion.div
              className={cn("from-gray-50 to-transparent absolute inset-x-0 z-10 h-24 bg-gradient-to-b top-0")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(side === "top" || side === "none") && (
            <motion.div
              className={cn("from-gray-50 to-transparent absolute inset-x-0 z-10 h-24 bg-gradient-to-t bottom-0")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <div
          className="flex flex-col gap-2 p-4 absolute inset-0 overflow-y-auto isolate"
          ref={props.containerRef}
          onScroll={(e) => {
            if (props.onScrollChange) {
              const distanceFromBottom = Math.abs(
                e.currentTarget.scrollHeight - (e.currentTarget.scrollTop + e.currentTarget.clientHeight),
              );
              props.onScrollChange(e, {
                isAtBottom: distanceFromBottom < 5,
              });
            }
          }}
        >
          <div className="flex flex-col gap-2 z-0" ref={messagesRef}>
            {props.messages.map((e) => (
              <Message data={e} key={e.id} />
            ))}
          </div>
          <div className="h-0 w-full shrink-0" ref={props.bottomRef} />
        </div>
        <AnimatePresence>
          {props.showNewMessage && (
            <motion.button
              initial={{ y: "100%", opacity: 0, x: "-50%" }}
              animate={{ y: "0%%", opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="absolute z-20 bottom-0.5 flex items-center gap-2 rounded-full px-4 py-1 font-semibold left-1/2 bg-white/50 border border-gray-200"
              type="button"
              onClick={() => {
                if (props.onNewMessageClick) {
                  props.onNewMessageClick();
                }
              }}
            >
              <p>New Messages</p>
              <ArrowDownCircleIcon className="size-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-auto shrink-0 flex flex-col gap-2">
        {props.onMessageSend && <ChatMessageInput onSubmit={props.onMessageSend} />}
        {props.children}
      </div>
    </div>
  );
};

const ChatMessageInput: FC<{
  onSubmit: (data: { message: string; attachments: ChatMessage["attachments"] }) => void;
}> = (props) => {
  const [value, setValue] = useState("");
  const [textAreaResetKey, setTextAreaResetKey] = useState(0);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<ChatMessage["attachments"]>([]);
  const { mutateAsync: upload } = useUploadFiles();
  const { width = 0 } = useWindowSize();

  const handleSubmit = useCallback(() => {
    props.onSubmit({ message: value, attachments });
    setValue("");
    setAttachments([]);

    setTextAreaResetKey((prev) => prev + 1);

    requestAnimationFrame(() => {
      if (textArea.current) {
        textArea.current.focus();
      }
    });
  }, [props.onSubmit, value, attachments]);

  return (
    <div className="flex flex-col justify-end">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ minHeight: 0, maxHeight: 0, opacity: 0, marginBottom: 0 }}
            animate={{
              minHeight: width > 1000 ? 120 : 240,
              maxHeight: width > 1000 ? 240 : 300,
              opacity: 1,
              marginBottom: 8,
            }}
            className="bg-gray-100 rounded-lg overflow-y-auto flex items-center"
            exit={{ opacity: 0, minHeight: 0, maxHeight: 0, marginBottom: 0 }}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 h-max p-2 w-full">
              {attachments.map((e) => (
                <div key={e.id} className="flex isolate overflow-hidden h-[116px]">
                  <div className="relative size-full">
                    <button
                      type="button"
                      className="absolute top-1 z-20 right-1 flex items-center justify-center cursor-pointer rounded-full size-5 shadow border bg-white hover:bg-gray-100 transition"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== e.id))}
                    >
                      <XIcon className="size-3" />
                    </button>
                    <div className="overflow-hidden size-full">
                      <Image imageId={e.id} width={200} className="object-cover size-full rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
          setValue("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSubmit();
          }
        }}
        className="relative flex flex-row"
      >
        <Textarea
          ref={textArea}
          value={value}
          key={textAreaResetKey.toString()}
          onValueChange={(t) => setValue(t)}
          minRows={1}
          classNames={{ input: "mr-6" }}
          endContent={
            <>
              <div>
                <label htmlFor="chat-file-input" className="absolute top-1/2 right-12 -translate-y-1/2 cursor-pointer">
                  <ImageIcon className="size-5" />
                </label>
                <input
                  type="file"
                  id="chat-file-input"
                  className="hidden"
                  onChange={async (e) => {
                    const result = await upload(e);

                    setAttachments((prev) => [
                      ...prev,
                      ...result.map((e) => ({ id: e.imageId, type: "image" as const })),
                    ]);
                  }}
                  accept={imageFormats.join(",")}
                  multiple
                />
              </div>
              <button
                type="submit"
                className="absolute top-1/2 right-4 -translate-y-1/2 disabled:opacity-50 transition"
                disabled={value.length === 0 && attachments.length === 0}
              >
                <ArrowRightIcon className="size-5" />
              </button>
            </>
          }
        />
      </form>
    </div>
  );
};

const Message: FC<{ data: ChatMessage }> = (props) => {
  return (
    <div className="flex z-10 shrink-0">
      <div
        className={cn("p-2 text-sm font-medium rounded-r-xl rounded-bl-sm rounded-tl-xl mr-auto", {
          "bg-blue-500 text-white": props.data.sender === "seller",
          "bg-gray-200/70": props.data.sender === "buyer",
          // "bg-blue-500 rounded-l-xl rounded-tr-xl rounded-br-sm ml-auto text-white": props.data.type === "outgoing",
        })}
      >
        <p className="text-xs opacity-80 font-medium capitalize">{props.data.sender}</p>
        <p className="whitespace-pre-line">{props.data.message}</p>
        {props.data.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {props.data.attachments.map((e) => (
              <MessageImage key={e.id} data={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MessageImage: FC<{ data: ChatMessage["attachments"][number] }> = (props) => {
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <button
        className="size-20 overflow-hidden hover:brightness-[75%] transition"
        type="button"
        onClick={() => onOpenChange()}
      >
        <Image width={100} imageId={props.data.id} />
      </button>
      {isOpen && (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" placement="center">
          <ModalContent className="[&>button]:z-50 [&>button]:bg-white [&>button]:text-black/80 [&>button]:p-0 [&>button]:size-7 [&>button>svg]:absolute [&>button>svg]:top-1/2 [&>button>svg]:left-1/2 [&>button>svg]:-translate-x-1/2 [&>button>svg]:-translate-y-1/2 [&>button]:transition [&>button]:backdrop-blur-md">
            <ModalBody className="px-0 py-0">
              <div className="h-[450px] lg:h-[700px]">
                <Image imageId={props.data.id} width={1200} className="hidden md:block rounded-none" />
                <Image imageId={props.data.id} width={600} className="md:hidden rounded-none" />
              </div>
              {/* {props.data.description !== undefined && (
              <p className="px-6 pt-2 pb-6 font-medium">{props.data.description}</p>
            )} */}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
