import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider"; 

const cognitoClient = new CognitoIdentityProviderClient();
const snsClient = new SNSClient();

export const handler = async (event) => {
  console.log(event);
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event
  }
  
  const { userName } = event;
  const { sub, phone_number } = event.request.userAttributes;
  
  if (!sub) {
    throw new Error("invalid event input")
  }
  if (!phone_number) {
    throw new Error("phone_number not specified")
  }
  
  const subscribeParams = {
    TopicArn: process.env.SNS_TOPIC_ARN,
    Protocol: "sms",
    Endpoint: phone_number,
    Attributes: {
      FilterPolicy: JSON.stringify({ "userID": [sub] }),
    },
    ReturnSubscriptionArn: true,
  };
  
  const subscibeCommand = new SubscribeCommand(subscribeParams);
  const subResponse = await snsClient.send(subscibeCommand);
  
  const updateInput = {
    UserPoolId: process.env.USER_POOL_ID,
    Username: userName,
    UserAttributes: [ 
      { 
        Name: "custom:subscription_arn",
        Value: subResponse.SubscriptionArn,
      },
    ],
  };
  const updateCommand = new AdminUpdateUserAttributesCommand(updateInput);
  await cognitoClient.send(updateCommand);
  
  return event;
};
