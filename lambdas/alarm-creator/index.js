import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid"; 
import jwt from "jsonwebtoken";

const schedulerClient = new SchedulerClient();
const dynamoClient = new DynamoDBClient();

export const handler = async (event) => {
  
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
  
  const { message, dates, crons, timezone } = JSON.parse(event.body);
  
  const eventID = uuid();
  const requests = [];
  
  // handling one time events
  const dateMap = {};
  
  for (let i = 0; i < dates.length; i++) {
    const ruleID = uuid();
    dateMap[ruleID] = { S: dates[i] };
    
    const input = {
      Name: ruleID,
      ScheduleExpression: `at(${dates[i]})`,
      ScheduleExpressionTimezone: timezone,
      Target: { 
        Arn: process.env.LAMBDA_FUNCTION_ARN,
        RoleArn: process.env.ROLE_ARN,
        Input: JSON.stringify({
          userID: userID,
          message: message
        }),
      },
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
    };
    const command = new CreateScheduleCommand(input);
    requests.push(schedulerClient.send(command));
  }
  
  
  // handling crons
  const cronMap = {};
  
  for (let i = 0; i < crons.length; i++) {
    const ruleID = uuid();
    cronMap[ruleID] = { S: crons[i] };
    
    const input = {
      Name: ruleID,
      ScheduleExpression: `cron(${crons[i]})`,
      ScheduleExpressionTimezone: timezone,
      Target: { 
        Arn: process.env.LAMBDA_FUNCTION_ARN,
        RoleArn: process.env.ROLE_ARN,
        Input: JSON.stringify({
          userID: userID,
          message: message
        }),
      },
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
    };
    const command = new CreateScheduleCommand(input);
    requests.push(schedulerClient.send(command));
  }
  
  const putEventInput = {
    TableName: process.env.DYNAMO_EVENTS_TABLE,
    Item: {
      "EventID": { S: eventID },
      "UserID": { S: userID },
      "Title": { S: message },
      "Crons": { M: cronMap },
      "Dates": { M: dateMap },
      "Timezone": { S: timezone },
    },
  };
  const command = new PutItemCommand(putEventInput);
  requests.push(dynamoClient.send(command));
  
  await Promise.all(requests);
  
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(putEventInput.Item),
  };
};
