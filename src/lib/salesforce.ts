import jsforce from 'jsforce';
import { User, IUser } from '@/models/User';
import { connectToDatabase } from './mongodb';

const SF_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID || '';
const SF_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET || '';
const SF_REDIRECT_URI = process.env.SALESFORCE_REDIRECT_URI || '';
const SF_LOGIN_URL = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

export function getOAuth2() {
  return new jsforce.OAuth2({
    loginUrl: SF_LOGIN_URL,
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    redirectUri: SF_REDIRECT_URI,
  });
}

export function getAuthorizationUrl(): string {
  const oauth2 = getOAuth2();
  return oauth2.getAuthorizationUrl({ scope: 'api refresh_token' });
}

export function getConnectionFromTokens(
  accessToken: string,
  refreshToken: string,
  instanceUrl: string
): jsforce.Connection {
  const oauth2 = getOAuth2();
  return new jsforce.Connection({
    oauth2,
    accessToken,
    refreshToken,
    instanceUrl,
  });
}

export async function getConnectionForUser(userId: string): Promise<jsforce.Connection | null> {
  await connectToDatabase();
  const user = await User.findById(userId);

  if (!user?.salesforce) {
    return null;
  }

  const { accessToken, refreshToken, instanceUrl, tokenExpiresAt } = user.salesforce;
  const conn = getConnectionFromTokens(accessToken, refreshToken, instanceUrl);

  if (new Date() > new Date(tokenExpiresAt)) {
    try {
      const newTokens = await conn.oauth2.refreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(userId, {
        'salesforce.accessToken': newTokens.access_token,
        'salesforce.tokenExpiresAt': expiresAt,
      });

      conn.accessToken = newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh Salesforce token:', error);
      return null;
    }
  }

  return conn;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  AccountName: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  Probability: number;
  ForecastCategory: string;
  OwnerId: string;
  OwnerName: string;
}

export async function fetchOpportunities(
  conn: jsforce.Connection,
  query?: string
): Promise<SalesforceOpportunity[]> {
  let soql = `
    SELECT Id, Name, Account.Name, Amount, StageName, CloseDate, 
           Probability, ForecastCategory, OwnerId, Owner.Name
    FROM Opportunity
    WHERE IsClosed = false
  `;

  if (query) {
    soql += ` AND (Name LIKE '%${query}%' OR Account.Name LIKE '%${query}%')`;
  }

  soql += ' ORDER BY CloseDate ASC LIMIT 100';

  const result = await conn.query<{
    Id: string;
    Name: string;
    Account?: { Name: string };
    Amount: number;
    StageName: string;
    CloseDate: string;
    Probability: number;
    ForecastCategory: string;
    OwnerId: string;
    Owner?: { Name: string };
  }>(soql);

  return result.records.map((record) => ({
    Id: record.Id,
    Name: record.Name,
    AccountName: record.Account?.Name || '',
    Amount: record.Amount || 0,
    StageName: record.StageName,
    CloseDate: record.CloseDate,
    Probability: record.Probability || 0,
    ForecastCategory: record.ForecastCategory || '',
    OwnerId: record.OwnerId,
    OwnerName: record.Owner?.Name || '',
  }));
}

export async function fetchOpportunityById(
  conn: jsforce.Connection,
  opportunityId: string
): Promise<SalesforceOpportunity | null> {
  const soql = `
    SELECT Id, Name, Account.Name, Amount, StageName, CloseDate,
           Probability, ForecastCategory, OwnerId, Owner.Name
    FROM Opportunity
    WHERE Id = '${opportunityId}'
  `;

  const result = await conn.query<{
    Id: string;
    Name: string;
    Account?: { Name: string };
    Amount: number;
    StageName: string;
    CloseDate: string;
    Probability: number;
    ForecastCategory: string;
    OwnerId: string;
    Owner?: { Name: string };
  }>(soql);

  if (result.records.length === 0) {
    return null;
  }

  const record = result.records[0];
  return {
    Id: record.Id,
    Name: record.Name,
    AccountName: record.Account?.Name || '',
    Amount: record.Amount || 0,
    StageName: record.StageName,
    CloseDate: record.CloseDate,
    Probability: record.Probability || 0,
    ForecastCategory: record.ForecastCategory || '',
    OwnerId: record.OwnerId,
    OwnerName: record.Owner?.Name || '',
  };
}

export async function fetchUserInfo(conn: jsforce.Connection): Promise<{
  id: string;
  email: string;
  name: string;
  managerId: string | null;
}> {
  const identity = await conn.identity();
  
  const userResult = await conn.query<{
    Id: string;
    Email: string;
    Name: string;
    ManagerId: string | null;
  }>(`SELECT Id, Email, Name, ManagerId FROM User WHERE Id = '${identity.user_id}'`);
  
  const user = userResult.records[0];
  return {
    id: user.Id,
    email: user.Email,
    name: user.Name,
    managerId: user.ManagerId,
  };
}
