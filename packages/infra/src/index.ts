import * as aws from "@pulumi/aws";
import { consola } from "consola";

const _iotPolicy = new aws.iot.Policy("iotPolicy", {
  policy: aws.iam
    .getPolicyDocument({
      version: "2012-10-17",
      statements: [
        {
          effect: "Allow",
          actions: ["iot:Connect", "iot:Publish", "iot:Subscribe", "iot:Receive"],
          resources: ["*"],
        },
      ],
    })
    .then((e) => e.json),
});

const appServiceUser = new aws.iam.User("appUser");

const _appUserPolicy = new aws.iam.UserPolicy("appUserPolicy", {
  user: appServiceUser.name,
  policy: aws.iam
    .getPolicyDocument({
      statements: [
        {
          effect: "Allow",
          resources: ["*"],
          actions: [
            "iot:AttachPolicy",
            "iot:ListAttachedPolicies",
            "iam:CreateRole",
            "iam:PutRolePolicy",
            "iam:DeleteRole",
          ],
        },
      ],
    })
    .then((e) => e.json),
});

const appAccessKeys = new aws.iam.AccessKey("appAccessKeys", { user: appServiceUser.name });

appAccessKeys.secret.apply((value) => consola.info(`Secret: ${value}`));
export const accessKeyId = appAccessKeys.id;
