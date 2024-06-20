import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient();

export const handler = async (event) => {
  console.log(event);
  
  const { userID, message } = event;
  
  const input = { 
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: message,
    MessageAttributes: { 
      "userID": { 
        DataType: "String",
        StringValue: userID,
      },
    },
  };
  const command = new PublishCommand(input);
  await snsClient.send(command);
  
  return "success";
};
