import { getAuth } from "@clerk/remix/ssr.server";
import { type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { type TicketListingChatMessage, ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useRef, useState } from "react";
import { omit } from "remeda";
import * as v from "valibot";
import { ChatMessages } from "~/components/ChatMessages";
import { Page } from "~/components/Page";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { logger } from "~/utils/logger";
import { trpc } from "~/utils/trpc/trpcClient";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Chat", noIndex: true });
};

const paramsSchema = v.object({ listingId: v.string(), transactionId: v.string() });

export const loader = async (args: LoaderFunctionArgs) => {
  const params = v.safeParse(paramsSchema, args.params);

  if (!params.success) {
    logger.error("Invald params", params.issues);
    throw redirect("/");
  }

  const auth = await getAuth(args);

  const transaction = await db.query.ticketListingTransactions.findFirst({
    where: eq(ticketListingTransactions.id, params.output.transactionId),
    with: {
      messages: true,
    },
  });

  if (!transaction) {
    logger.error("Could not find transaction", params);
    throw redirect("/");
  }

  const messages: ChatMessage[] = transaction.messages.map((e) => ({
    ...e,
    imageUrl: "",
    type: !e.userId || e.userId === auth.userId ? "outgoing" : "incoming",
  }));

  return { transaction: omit(transaction, ["messages"]), messages };
};

type ChatMessage = TicketListingChatMessage & { type: "incoming" | "outgoing"; imageUrl: string };

const Route = () => {
  const ld = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<ChatMessage[]>(ld.messages);
  const bottom = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  const scrollToBottom = useCallback((scrollBehaviour: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (bottom.current) {
        bottom.current.scrollIntoView({ inline: "end", behavior: scrollBehaviour });
      }
    });
  }, []);

  const { mutateAsync: createMessage } = trpc.listings.chat.createMessage.useMutation({
    onSuccess: (message, _vars) => {
      setMessages((prev) => [...prev, { ...message, type: "outgoing", imageUrl: "" }]);

      if (isAtBottom.current) {
        scrollToBottom();
      }
    },
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAtBottom.current) {
        scrollToBottom();
      }
    });

    if (container.current) {
      observer.observe(container.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  return (
    <Page classNames={{ content: "flex-1 flex flex-col py-4" }}>
      <div className="flex-col flex-1 flex mx-auto max-w-2xl w-full">
        <ChatMessages
          bottomRef={bottom}
          containerRef={container}
          messages={messages}
          onScrollChange={(_e, data) => {
            isAtBottom.current = data.isAtBottom;
          }}
          onMessageSend={(message) => {
            createMessage({ message, transactionId: ld.transaction.id });
          }}
        />
      </div>
    </Page>
  );
};

export default Route;
