import { getAuth } from "@clerk/remix/ssr.server";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { parsePubSubMessage } from "common/pubsub";
import { type ChatMessage, ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import { CheckIcon, OctagonAlert } from "lucide-react";
import usePartySocket from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { omit } from "remeda";
import * as v from "valibot";
import { ChatMessages } from "~/components/ChatMessages";
import { Page } from "~/components/Page";
import { ReportSellerForm } from "~/components/ReportSellerForm";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { formatChatMessages } from "~/utils/formatChatMessages";
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
    // Not the buyer or seller

    if (auth.userId) {
      throw redirect("/");
    } else {
      throw redirect(`/login?redirect_url=${args.request.url}`);
    }
  }

  const { messages, sender } = await formatChatMessages({ transaction, userId: auth.userId });

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
  const navigate = useNavigate();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const { isOpen: isReportOpen, onOpenChange: toggleReportOpen } = useDisclosure();
  const { isOpen: isCompleteOpen, onOpenChange: toggleCompleteOpen } = useDisclosure();

  const isCompleted = ld.transaction.completedAt !== null;

  const scrollToBottom = useCallback((scrollBehaviour: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (bottom.current) {
        bottom.current.scrollIntoView({ inline: "end", behavior: scrollBehaviour });
        isAtBottom.current = true;
      }
    });
  }, []);

  const { mutateAsync: createMessage } = trpc.listings.chat.createMessage.useMutation();
  const { mutateAsync: completeTransaction, isPending: isCompleteLoading } =
    trpc.listings.transactions.completeTransaction.useMutation({
      onSuccess: () => {
        navigate("/");
      },
    });
  const { mutateAsync: createReport } = trpc.listings.transactions.createReport.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

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

            <ReportSellerForm
              onSubmit={async (data) => {
                await createReport({
                  reason: data.reason,
                  description: data.description,
                  transactionId: ld.transaction.id,
                });
              }}
            />
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
            <Button
              color="primary"
              className="text-white"
              onClick={() => completeTransaction({ transactionId: ld.transaction.id })}
              isLoading={isCompleteLoading}
            >
              Complete Transaction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="flex-col flex-1 flex mx-auto max-w-2xl w-full sm:shadow rounded-3xl p-4">
        <h1 className="font-bold text-lg mb-2">Chat</h1>
        <ChatMessages
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
          onMessageSend={
            !isCompleted
              ? async (message) => {
                  await createMessage({ message, transactionId: ld.transaction.id });
                }
              : undefined
          }
        >
          {ld.sender === "buyer" && (
            <div className="flex gap-2 items-center justify-center">
              <Button
                color="danger"
                variant="light"
                endContent={<OctagonAlert className="size-4" />}
                onClick={toggleReportOpen}
              >
                Report
              </Button>
              {!isCompleted && (
                <Button
                  color="primary"
                  endContent={<CheckIcon className="size-4" />}
                  className="text-white"
                  onClick={toggleCompleteOpen}
                >
                  Complete
                </Button>
              )}
            </div>
          )}
        </ChatMessages>
      </div>
    </Page>
  );
};

export default Route;
