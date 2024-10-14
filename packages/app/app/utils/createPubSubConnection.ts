import { createId } from "@paralleldrive/cuid2";
import { iot, mqtt } from "aws-iot-device-sdk-v2";

export const createPubSubConnection = (args: {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  };
  region: string;
  endpoint: string;
}) => {
  const config = iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
    .with_endpoint(args.endpoint)
    .with_credentials(
      args.region,
      args.credentials.accessKeyId,
      args.credentials.secretAccessKey,
      args.credentials.sessionToken,
    )
    .with_client_id(createId())
    .with_clean_session(true)
    .with_keep_alive_seconds(30)
    .build();

  console.log(config);

  const client = new mqtt.MqttClient();

  const newConnection = client.new_connection(config);

  return newConnection;
};
