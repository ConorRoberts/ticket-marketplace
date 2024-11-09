import { getAuth } from "@clerk/remix/ssr.server";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/select";
import { type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parsePubSubMessage } from "common/pubsub";
import { type ChatMessage, ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import usePartySocket from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isNonNullish, omit } from "remeda";
import * as v from "valibot";
import { ChatMessages } from "~/components/ChatMessages";
import { Page } from "~/components/Page";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { logger } from "~/utils/logger";
import { trpc } from "~/utils/trpc/trpcClient";
import { useEnv } from "~/utils/useEnv";

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
      ticketListing: {
        with: {
          merchant: true,
        },
      },
    },
  });

  if (!transaction) {
    logger.error("Could not find transaction", params);
    throw redirect("/");
  }

  const transactionHasAuthenticatedBuyer = Boolean(transaction.buyerUserId);
  const isBuyerOrSeller =
    auth && (auth.userId === transaction.ticketListing.merchant.userId || auth.userId === transaction.buyerUserId);

  if (transactionHasAuthenticatedBuyer && !isBuyerOrSeller) {
    throw Error("Authentication required");
  }

  const users = await clerk.users.getUserList({
    userId: [transaction.buyerUserId, transaction.ticketListing.merchant.userId].filter(isNonNullish),
  });

  const merchantUser = users.data.find((e) => e.id === transaction.ticketListing.merchant.userId);

  if (!merchantUser) {
    logger.error("Merchant user was undefined");
    throw redirect("/");
  }

  const messages: ChatMessage[] = transaction.messages.map((e) => ({
    ...e,
    imageUrl: e.userId === transaction.ticketListing.merchant.userId ? merchantUser.imageUrl : "",
    sender: transaction.ticketListing.merchant.userId === e.userId ? "seller" : "buyer",
  }));

  const sender: ChatMessage["sender"] = transaction.ticketListing.merchant.userId === auth.userId ? "seller" : "buyer";

  return {
    transaction: omit(transaction, ["messages"]),
    messages,
    sender,
  };
};

const Route = () => {
  const ld = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<ChatMessage[]>(ld.messages);
  const bottom = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const env = useEnv();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const { isOpen: isReportOpen, onOpenChange: toggleReportOpen } = useDisclosure();
  const { isOpen: isCompleteOpen, onOpenChange: toggleCompleteOpen } = useDisclosure();

  const scrollToBottom = useCallback((scrollBehaviour: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (bottom.current) {
        bottom.current.scrollIntoView({ inline: "end", behavior: scrollBehaviour });
        isAtBottom.current = true;
      }
    });
  }, []);

  const { mutateAsync: createMessage } = trpc.listings.chat.createMessage.useMutation();

  usePartySocket({
    room: ld.transaction.id,
    host: env.PUBLIC_PARTYKIT_URL,
    onMessage: (event) => {
      const msg = parsePubSubMessage(event.data);

      if (msg.type === "chatMessage") {
        setMessages((prev) => [
          ...prev,
          {
            ...msg.data,
            sender: msg.data.userId === ld.transaction.ticketListing.merchant.userId ? "seller" : "buyer",
            imageUrl: "",
          },
        ]);

        if (isAtBottom.current) {
          scrollToBottom();
        } else {
          setShowNewMessage(true);
        }
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
    <Page classNames={{ content: "flex-1 flex flex-col py-4", container: "px-0" }}>
      <Modal isOpen={isReportOpen} onOpenChange={toggleReportOpen}>
        <ModalContent>
          <ModalHeader>Report Seller</ModalHeader>
          <ModalBody className="mb-2">
            <p className="font-medium">
              If you believe this seller is acting against platform guidelines, please send a report to let the
              moderation team know.
            </p>
            {/* <p className="bg-danger/50 rounded-lg p-2 text-sm font-medium text-white">
              Reporting a seller will immediately revoke chat access for both the buyer and seller. If a seller is found
              to be in breach of the platform guidelines, the purchase will be refunded.
            </p> */}

            <ReportForm />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isCompleteOpen} onOpenChange={toggleCompleteOpen}>
        <ModalContent>
          <ModalHeader>Complete Transaction</ModalHeader>
          <ModalBody>
            <p className="font-medium">
              Once you have received your tickets from the seller, click "Complete Transaction" below.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light">Go Back</Button>
            <Button color="success" className="text-white">
              Complete Transaction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="flex-col flex-1 flex mx-auto max-w-2xl w-full sm:shadow rounded-3xl p-4">
        <h1 className="font-bold text-lg mb-2">Chat</h1>
        <ChatMessages
          sender={ld.sender}
          onReport={toggleReportOpen}
          onComplete={toggleCompleteOpen}
          bottomRef={bottom}
          containerRef={container}
          messages={messages}
          showNewMessage={showNewMessage}
          onNewMessageClick={() => {
            scrollToBottom();
            setShowNewMessage(false);
          }}
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

const reportReasons = ["Scamming", "Abusive language", "Other"];
const ReportForm = () => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="flex flex-col gap-4"
    >
      <Select label="Reason for report" isRequired>
        {reportReasons.map((reason) => (
          <SelectItem key={reason}>{reason}</SelectItem>
        ))}
      </Select>
      <Textarea label="Description" />
      <Button type="submit" color="primary">
        Submit
      </Button>
    </form>
  );
};

export default Route;
