import { Textarea } from "@nextui-org/react";
import type { TicketListingChatMessage } from "common/schema";
import { ArrowRightIcon } from "lucide-react";
import { type FC, type RefObject, useCallback, useRef, useState } from "react";
import type React from "react";
import { cn } from "~/utils/cn";

export const ChatMessages: FC<{
  onMessageSend: (message: string) => void;
  messages: TicketListingChatMessage[];
  className?: string;
  bottomRef?: RefObject<HTMLDivElement>;
  containerRef?: RefObject<HTMLDivElement>;
  onScrollChange?: (event: React.UIEvent<HTMLDivElement, UIEvent>, additionalData: { isAtBottom: boolean }) => void;
}> = (props) => {
  return (
    <div className={cn("bg-blue-500 flex flex-col flex-1 p-2 gap-2", props.className)}>
      <div className="flex flex-col gap-2 flex-1 relative overflow-hidden">
        <div
          className="flex flex-col gap-2 absolute inset-0 overflow-y-auto isolate"
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
          <div className="flex flex-col gap-2">
            {props.messages.map((e) => (
              <Message data={e} type="incoming" key={e.id} />
            ))}
          </div>
          <div className="h-0 w-full shrink-0" ref={props.bottomRef} />
        </div>
      </div>
      <div className="mt-auto shrink-0">
        <ChatMessageInput onSubmit={props.onMessageSend} />
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

const Message: FC<{ data: TicketListingChatMessage; type: "incoming" | "outgoing" }> = (props) => {
  return (
    <div className="flex z-10 shrink-0">
      <div
        className={cn("p-2", {
          "bg-gray-100 rounded-r-xl rounded-bl-sm rounded-tl-xl mr-auto": props.type === "incoming",
          "bg-blue-500 rounded-l-xl rounded-tr-xl rounded-br-sm ml-auto": props.type === "outgoing",
        })}
      >
        <p className="whitespace-pre-line">{props.data.message}</p>
      </div>
    </div>
  );
};
