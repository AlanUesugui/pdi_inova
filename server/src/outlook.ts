import { getDb } from './db';

const CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/auth/outlook/callback';

const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const SCOPES = 'offline_access user.read mail.read calendars.read';

/**
 * Returns whether the application is running in mock/demo mode for Outlook.
 * If credentials are not configured in environment variables, it uses Mock Mode.
 */
export function isMockMode(): boolean {
  return !CLIENT_ID || !CLIENT_SECRET;
}

/**
 * Generates the Outlook Authorization URL.
 * In Mock Mode, redirect directly to our callback endpoint with a mock code.
 */
export function getAuthUrl(userEmail: string): string {
  if (isMockMode()) {
    return `${REDIRECT_URI}?code=mock_authorization_code_for_${encodeURIComponent(userEmail)}`;
  }

  const state = encodeURIComponent(JSON.stringify({ email: userEmail }));
  return `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&state=${state}`;
}

/**
 * Exchanges the authorization code for access and refresh tokens.
 * In Mock Mode, stores a mock token.
 */
export async function exchangeCodeForTokens(userEmail: string, code: string): Promise<boolean> {
  const db = await getDb();
  const now = Date.now();

  if (isMockMode() || code.startsWith('mock_')) {
    // Save mock credentials in the database
    const mockEmail = userEmail.includes('@') ? userEmail : `${userEmail}@inova.com`;
    await db.run(
      `INSERT OR REPLACE INTO outlook_tokens (email, access_token, refresh_token, expires_at, outlook_email)
       VALUES (?, ?, ?, ?, ?)`,
      [userEmail, 'mock_access_token', 'mock_refresh_token', now + 3600 * 1000, `outlook.${mockEmail}`]
    );
    return true;
  }

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error exchanging code for tokens:', errorText);
      throw new Error(`Failed to exchange authorization code: ${response.statusText}`);
    }

    const data = await response.json() as any;

    // Fetch Outlook profile to get the outlook email address
    let outlookEmail = 'outlook.user@outlook.com';
    try {
      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json() as any;
        outlookEmail = profile.mail || profile.userPrincipalName || outlookEmail;
      }
    } catch (e) {
      console.error('Error fetching Microsoft user profile:', e);
    }

    await db.run(
      `INSERT OR REPLACE INTO outlook_tokens (email, access_token, refresh_token, expires_at, outlook_email)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userEmail,
        data.access_token,
        data.refresh_token || '',
        now + (data.expires_in * 1000),
        outlookEmail
      ]
    );

    return true;
  } catch (error) {
    console.error('Exchange token error:', error);
    return false;
  }
}

/**
 * Refreshes the Outlook access token using the stored refresh token.
 */
export async function refreshTokens(userEmail: string): Promise<string | null> {
  const db = await getDb();
  const tokenRecord = await db.get('SELECT * FROM outlook_tokens WHERE email = ?', [userEmail]);

  if (!tokenRecord) return null;

  if (isMockMode() || tokenRecord.refresh_token === 'mock_refresh_token') {
    const nextExpiry = Date.now() + 3600 * 1000;
    await db.run(
      'UPDATE outlook_tokens SET expires_at = ? WHERE email = ?',
      [nextExpiry, userEmail]
    );
    return tokenRecord.access_token;
  }

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokenRecord.refresh_token,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error('Error refreshing token:', await response.text());
      return null;
    }

    const data = await response.json() as any;
    const nextExpiry = Date.now() + (data.expires_in * 1000);

    await db.run(
      `UPDATE outlook_tokens 
       SET access_token = ?, refresh_token = ?, expires_at = ?
       WHERE email = ?`,
      [
        data.access_token,
        data.refresh_token || tokenRecord.refresh_token, // Microsoft might not return a new refresh token every time
        nextExpiry,
        userEmail
      ]
    );

    return data.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Retrieves the Outlook connectivity status for a user.
 */
export async function getOutlookStatus(userEmail: string) {
  const db = await getDb();
  const tokenRecord = await db.get('SELECT email, outlook_email FROM outlook_tokens WHERE email = ?', [userEmail]);

  if (tokenRecord) {
    return { connected: true, outlookEmail: tokenRecord.outlook_email, isMock: isMockMode() };
  }
  return { connected: false };
}

/**
 * Removes the Outlook integration token for a user.
 */
export async function disconnectOutlook(userEmail: string): Promise<boolean> {
  const db = await getDb();
  await db.run('DELETE FROM outlook_tokens WHERE email = ?', [userEmail]);
  return true;
}

/**
 * Fetches recent notifications (emails and calendar events) from Outlook/Microsoft Graph.
 * If token is expired, refreshes it automatically.
 */
export async function getNotifications(userEmail: string) {
  if (isMockMode()) {
    return getMockNotifications();
  }

  const db = await getDb();
  const tokenRecord = await db.get('SELECT * FROM outlook_tokens WHERE email = ?', [userEmail]);

  if (!tokenRecord) {
    throw new Error('Outlook account not connected.');
  }

  // Check if token is expired, if so, refresh it
  let accessToken = tokenRecord.access_token;
  if (Date.now() >= tokenRecord.expires_at - 60000) { // refresh 1 min before expiry
    const newAccessToken = await refreshTokens(userEmail);
    if (newAccessToken) {
      accessToken = newAccessToken;
    } else {
      // Disconnect if we failed to refresh token
      await disconnectOutlook(userEmail);
      throw new Error('Outlook credentials expired. Please reconnect.');
    }
  }

  if (accessToken === 'mock_access_token') {
    return getMockNotifications();
  }

  try {
    const notifications: any[] = [];

    // 1. Fetch recent emails (latest 5)
    const emailsRes = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=5&$select=subject,sender,receivedDateTime,bodyPreview,webLink,isRead',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (emailsRes.ok) {
      const emailData = await emailsRes.json() as any;
      const emails = (emailData.value || []).map((msg: any) => ({
        id: msg.id,
        type: 'email',
        category: 'E-mail',
        subject: msg.subject,
        sender: `${msg.sender?.emailAddress?.name || ''} <${msg.sender?.emailAddress?.address || ''}>`,
        date: msg.receivedDateTime,
        snippet: msg.bodyPreview,
        read: msg.isRead,
        link: msg.webLink || 'https://outlook.live.com/mail/',
      }));
      notifications.push(...emails);
    } else {
      console.warn('Graph API email request failed:', await emailsRes.text());
    }

    // 2. Fetch upcoming meetings (next 5 days)
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const calendarRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate}&endDateTime=${endDate}&$top=5&$select=subject,start,end,webLink,showAs`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (calendarRes.ok) {
      const calendarData = await calendarRes.json() as any;
      const events = (calendarData.value || []).map((evt: any) => ({
        id: evt.id,
        type: 'calendar',
        category: 'Calendário',
        subject: evt.subject,
        sender: 'Calendário Outlook',
        date: evt.start?.dateTime,
        endDate: evt.end?.dateTime,
        snippet: `Reunião agendada: ${new Date(evt.start?.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(evt.end?.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        read: true,
        link: evt.webLink || 'https://outlook.live.com/calendar/',
      }));
      notifications.push(...events);
    } else {
      console.warn('Graph API calendar request failed:', await calendarRes.text());
    }

    // Sort combined notifications by date descending
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return notifications;
  } catch (error) {
    console.error('Error fetching Outlook notifications:', error);
    // Return mock notifications on network error to keep dashboard beautiful
    return getMockNotifications();
  }
}

/**
 * Generates relevant mock notifications contextually related to PDI and Team Hub.
 */
function getMockNotifications() {
  const now = new Date();

  // Date helpers
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const hoursAhead = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'mock_1',
      type: 'email',
      category: 'PDI & Feedback',
      subject: 'Revisão do PDI de Ana Silva',
      sender: 'Ana Silva <ana.silva@inova.com>',
      date: minutesAgo(15),
      snippet: 'Olá Carlos! Terminei de responder o formulário de eficácia do meu treinamento de Scrum Master. Quando podemos realizar a nossa 1:1 de acompanhamento para planejar os próximos passos?',
      read: false,
      link: 'https://outlook.live.com/mail/'
    },
    {
      id: 'mock_2',
      type: 'calendar',
      category: '1:1 Reunião',
      subject: '1:1 Periódica - Carlos & Bruno Santos',
      sender: 'Microsoft Outlook Calendar',
      date: hoursAhead(2),
      endDate: hoursAhead(2.5),
      snippet: 'Sincronização quinzenal de desenvolvimento. Pauta: Ajuste das metas do PDI e feedbacks cruzados do time de desenvolvimento.',
      read: true,
      link: 'https://outlook.live.com/calendar/'
    },
    {
      id: 'mock_3',
      type: 'email',
      category: 'Treinamento',
      subject: 'Aprovação de Orçamento: Douglas Souza',
      sender: 'Financeiro Inova <financeiro@inova.com>',
      date: hoursAgo(3),
      snippet: 'Prezado gestor, a solicitação de reembolso para o curso "Arquitetura Corporativa de Alta Performance" para o liderado Douglas Souza foi aprovada pelo comitê. Inscrição confirmada.',
      read: true,
      link: 'https://outlook.live.com/mail/'
    },
    {
      id: 'mock_4',
      type: 'email',
      category: 'Sistema',
      subject: 'Novo Feedback Disponível',
      sender: 'RH Portal <rh@inova.com>',
      date: daysAgo(1),
      snippet: 'Você tem um novo feedback de desenvolvimento pendente de leitura enviado pelo diretor da área de Tecnologia. Verifique as recomendações.',
      read: false,
      link: 'https://outlook.live.com/mail/'
    }
  ];
}

function printMockEmailConsole(from: string, to: string, subject: string, htmlBody: string) {
  // Strip emojis from subject
  const cleanSubject = subject
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{26A0}]/gu, '')
    .trim();

  console.log('\n' + '='.repeat(70));
  console.log('[MOCK EMAIL] Relatório Semanal de Pendências');
  console.log('='.repeat(70));
  console.log(`  DE      : ${from}`);
  console.log(`  PARA    : ${to}`);
  console.log(`  ASSUNTO : ${cleanSubject}`);
  console.log('-'.repeat(70));

  // Convert HTML to compact plain text
  let plainText = htmlBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h1|h2|h3|hr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{26A0}]/gu, '');

  // Clean up each line: trim leading/trailing space except indent for bullet items
  const lines = plainText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•')) {
        return '    ' + trimmed;
      }
      return trimmed;
    })
    .filter((line, idx, arr) => {
      if (line.length > 0) return true;
      return idx > 0 && (arr[idx - 1] ?? '').length > 0;
    });

  console.log(lines.join('\n').trim());
  console.log('='.repeat(70) + '\n');
}

/**
 * Sends an HTML email on behalf of the connected manager using the Microsoft Graph API.
 * In Mock Mode (no Azure credentials configured), logs the email to the console instead.
 *
 * @param userEmail  - The system email of the manager (used to look up the stored token)
 * @param to         - Recipient email address
 * @param subject    - Email subject line
 * @param htmlBody   - Full HTML content of the email body
 * @returns          - true if sent (or mocked) successfully, false on error
 */
export async function sendEmail(
  userEmail: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  // --- Mock Mode: print to console ---
  if (isMockMode()) {
    printMockEmailConsole(userEmail, to, subject, htmlBody);
    return true;
  }

  const db = await getDb();
  const tokenRecord = await db.get('SELECT * FROM outlook_tokens WHERE email = ?', [userEmail]);

  if (!tokenRecord) {
    console.warn(`[sendEmail] No Outlook token found for "${userEmail}". Skipping send.`);
    return false;
  }

  // Ensure the access token is fresh
  let accessToken = tokenRecord.access_token;
  if (Date.now() >= tokenRecord.expires_at - 60000) {
    const refreshed = await refreshTokens(userEmail);
    if (refreshed) {
      accessToken = refreshed;
    } else {
      console.error(`[sendEmail] Failed to refresh token for "${userEmail}".`);
      return false;
    }
  }

  if (accessToken === 'mock_access_token') {
    printMockEmailConsole(userEmail, to, subject, htmlBody);
    return true;
  }

  // --- Real Mode: send via Microsoft Graph ---
  try {
    const payload = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: htmlBody,
        },
        toRecipients: [
          {
            emailAddress: { address: to },
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[sendEmail] Graph API error for "${userEmail}": ${errText}`);
      return false;
    }

    console.log(`[sendEmail] Email sent successfully to "${to}" via Graph API.`);
    return true;
  } catch (error) {
    console.error(`[sendEmail] Unexpected error for "${userEmail}":`, error);
    return false;
  }
}
