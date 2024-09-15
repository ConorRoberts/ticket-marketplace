import { SignIn } from "@clerk/remix";
import type { MetaFunction } from "@remix-run/node";
import { createMetadata } from "~/utils/createMetadata";

export const meta: MetaFunction = () => createMetadata({ title: "Login", canonical: "/login" });

const Page = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-2 flex-col gap-8">
      <SignIn fallbackRedirectUrl="/?auth-success=true" signUpUrl="/register" path="/login" />
    </div>
  );
};

export default Page;
