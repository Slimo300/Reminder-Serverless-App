import { DynamoDBClient, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { SchedulerClient, DeleteScheduleCommand } from "@aws-sdk/client-scheduler";

import jwt from "jsonwebtoken";

const schedulerClient = new SchedulerClient();
const dynamoClient = new DynamoDBClient();

export const handler = async (event) => {
  // Getting token from Authorization header
  const token = event.headers['Authorization'];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'No Authorization header' }),
    };
  }

  // Decoding JWT
  const decodedToken = jwt.decode(token, { complete: true });
  if (!decodedToken) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Inalid JWT Token' }),
    };
  }

  // Getting userID from token payload
  const userID = decodedToken.payload.sub;
  if (!userID) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid Token"})
    };
  }
  
  const { eventID } = JSON.parse(event.body);
  
  const itemData = {
    Key: {
      UserID: {
        S: userID,
      },
      EventID: {
        S: eventID,
      },
    },
    TableName: process.env.DYNAMO_TABLE_ARN,
  };
  const getItemCommand = new GetItemCommand(itemData);
  const getItemResponse = await dynamoClient.send(getItemCommand);
  
  const requests = [];
  
  Object.keys(getItemResponse.Item.Dates.M).map(key => {
    const input = { 
      Name: key,
    };
    const command = new DeleteScheduleCommand(input);
    requests.push(schedulerClient.send(command));
  });
  Object.keys(getItemResponse.Item.Crons.M).map(key => {
    const input = { 
      Name: key,
    };
    const command = new DeleteScheduleCommand(input);
    requests.push(schedulerClient.send(command));
  });
  
  await Promise.all(requests);
  
  const command = new DeleteItemCommand(itemData);
  const response = await dynamoClient.send(command);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(response.Items),
  };
};
