import * as aws from "@pulumi/aws";

export const lambdaLoggingPolicy = new aws.iam.Policy("lambdaLoggingPolicy", {
  name: "lambdaLoggingPolicy",
  path: "/",
  policy: aws.iam
    .getPolicyDocument({
      statements: [
        {
          effect: "Allow",
          actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
          resources: ["arn:aws:logs:*:*:*"],
        },
      ],
    })
    .then((e) => e.json),
});
