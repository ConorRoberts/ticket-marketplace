import { SignUp } from "@clerk/remix";
import type { MetaFunction } from "@remix-run/react";
import { createMetadata } from "~/utils/createMetadata";

export const meta: MetaFunction = () => createMetadata({ title: "Register", canonical: "/register" });

const Page = () => {
  return (
    <div className="flex flex-1 justify-center items-center">
      <SignUp fallbackRedirectUrl="/?auth-success=true" signInUrl="/login" path="/register" />
    </div>
  );
};

export default Page;
