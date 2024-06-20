import { SNSClient, SubscribeCommand, UnsubscribeCommand } from "@aws-sdk/client-sns";
import { CognitoIdentityProviderClient, ListUsersCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider"; 

const cognitoClient = new CognitoIdentityProviderClient();
const snsClient = new SNSClient();

exports.handler = async (event) => {
  const userPoolId = event.userPoolId;
  const userName = event.userName;
  const triggerSource = event.triggerSource;
  const { phone_number, sub } = event.request.userAttributes;
      
  if (!phone_number || !sub) {
    throw new Error("Invalid User Object");
  }

  if (event.triggerSource === "CustomMessage_UpdateUserAttribute") {
    
    const input = {
      "Filter": `phone_number = "${phone_number}"`,
      "UserPoolId": userPoolId,
    };
    const command = new ListUsersCommand(input);
    const response = await cognitoClient.send(command);
    
    for (let i = 0; i <= response.Users.length; i++) {
      for (let j = 0; j <= response.Users[i].Attributes[j]; j++) {
        if (response.Users[i].Attributes[j].Name === "phone_number_verified" && response.Users[i].Attributes[j].Value === "true") {
          throw new Error("Phone number already taken");
        }
      }
    }
  }
    
  if (event.triggerSource === "CustomMessage_VerifyUserAttribute") {
      
    const subscriptionArn = event.request.UserAttributes["custom:subscription_arn"];
    if (!subscriptionArn) {
      throw new Error("User has no SMS subscription");
    }
    
    // deleting old SNS subscription
    const unsubscribeInput = {
      SubscriptionArn: subscriptionArn
    }
    const unsubscribeCommand = new UnsubscribeCommand(unsubscribeInput);
    await snsClient.send(unsubscribeCommand);
    
    // creating new SNS subscription
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
      
    // updating user subscription_arn custom attribute
    const updateInput = {
      UserPoolId: userPoolId,
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
  }

  return event;
};