import { Button, Textarea } from "@nextui-org/react";
import type { ChatMessage } from "common/schema";
import { AnimatePresence, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowDownCircleIcon, ArrowRightIcon, CheckIcon, OctagonAlert } from "lucide-react";
import { type FC, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { cn } from "~/utils/cn";

export const ChatMessages: FC<{
  onMessageSend: (message: string) => void;
  messages: ChatMessage[];
  className?: string;
  bottomRef?: RefObject<HTMLDivElement>;
  containerRef?: RefObject<HTMLDivElement>;
  showNewMessage?: boolean;
  onNewMessageClick?: () => void;
  onReport: () => void;
  onComplete: () => void;
  onScrollChange?: (event: React.UIEvent<HTMLDivElement, UIEvent>, additionalData: { isAtBottom: boolean }) => void;
  sender: ChatMessage["sender"];
}> = (props) => {
  const scroll = useScroll(props.containerRef ? { container: props.containerRef } : undefined);
  const [side, setSide] = useState<"top" | "bottom" | "none" | null>(null);

  useEffect(() => {
    return scroll.scrollYProgress.on("change", (value) => {
      if (value < 0.05) {
        setSide("top");
      } else if (value > 0.95) {
        setSide("bottom");
      } else {
        setSide("none");
      }
    });
  }, [scroll]);

  return (
    <div className={cn("flex flex-col flex-1 p-2 gap-2", props.className)}>
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
          <div className="flex flex-col gap-2 z-0">
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
        <ChatMessageInput onSubmit={props.onMessageSend} />
        {props.sender === "buyer" && (
          <div className="flex gap-2 items-center justify-center">
            <Button
              color="danger"
              variant="light"
              endContent={<OctagonAlert className="size-4" />}
              onClick={props.onReport}
            >
              Report
            </Button>
            <Button
              color="success"
              endContent={<CheckIcon className="size-4" />}
              className="text-white"
              onClick={props.onComplete}
            >
              Complete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatMessageInput: FC<{ onSubmit: (message: string) => void }> = (props) => {
  const [value, setValue] = useState("");
  const [textAreaResetKey, setTextAreaResetKey] = useState(0);
  const textArea = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    props.onSubmit(value);
    setValue("");

    setTextAreaResetKey((prev) => prev + 1);

    requestAnimationFrame(() => {
      if (textArea.current) {
        textArea.current.focus();
      }
    });
  }, [props.onSubmit, value]);

  return (
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
        onChange={(e) => {
          if (e.target) {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }
        }}
        minRows={1}
        onResize={(e) => console.log(e)}
        classNames={{ input: "mr-6" }}
        endContent={
          <button type="submit" className="absolute top-1/2 right-4 -translate-y-1/2 ">
            <ArrowRightIcon className="size-5" />
          </button>
        }
      />
    </form>
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
      </div>
    </div>
  );
};
