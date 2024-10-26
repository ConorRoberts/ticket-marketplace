import type { FC } from "react";
import type { CreateEmailOptions } from "resend";
import { resend } from "./resend.server";

export const sendEmail = async <T extends object>(
  options: Omit<CreateEmailOptions, "react" | "html" | "from">,
  react: { component: FC<T>; props: T },
) => {
  const Component = react.component;

  await resend.emails.send({
    react: <Component {...react.props} />,
    ...options,
    subject: `Party Box - ${options.subject}`,
    from: "Party Box <noreply@partybox.im>",
  });
};

export const sendBatchEmail = async <T extends object>(
  args: { options: Omit<CreateEmailOptions, "react" | "html" | "from">; react: { component: FC<T>; props: T } }[],
) => {
  const input: CreateEmailOptions[] = args.map((e) => {
    const Component = e.react.component;

    return {
      react: <Component {...e.react.props} />,
      ...e.options,
      subject: `Party Box - ${e.options.subject}`,
      from: "Party Box <noreply@partybox.im>",
    };
  });

  await resend.batch.send(input);
};
