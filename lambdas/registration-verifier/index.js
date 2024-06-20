import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider"; 

const cognitoClient = new CognitoIdentityProviderClient();

export const handler = async (event) => {
  console.log(event);
  if (event.triggerSource !== 'CustomMessage_VerifyUserAttribute') {
    return event
  }
  
  const { phone_number } = event.request.userAttributes;
  
  if (!phone_number) {
    throw new Error("Invalid User Object");
  }
  
  const input = {
    "Filter": `phone_number = "${phone_number}"`,
    "UserPoolId": process.env.USER_POOL_ID,
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
  
  return event;
};
