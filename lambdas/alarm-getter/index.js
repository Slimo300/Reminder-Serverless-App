import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

import jwt from "jsonwebtoken";

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
  
  const input = {
    ExpressionAttributeValues: {
      ":userID": {
        S: userID
      }
    },
    ExpressionAttributeNames: {
      "#userID": "UserID"
    },
    KeyConditionExpression: "#userID = :userID",
    TableName: process.env.DYNAMO_TABLE_ARN,
  };
  const command = new QueryCommand(input);
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
