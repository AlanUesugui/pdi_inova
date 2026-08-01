import { getDb } from './db';
import { sendEmail, isMockMode } from './outlook';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingIssue {
  collaboratorId: string;
  collaboratorName: string;
  role: string;
  issues: string[];
}

export interface WeeklyReportResult {
  managerEmail: string;
  managerId: string;
  collaboratorsAnalyzed: number;
  totalIssues: number;
  sent: boolean;
  status: 'sent' | 'failed' | 'mock' | 'skipped';
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_WITHOUT_FEEDBACK_THRESHOLD = 30;
const DAYS_WITHOUT_1_ON_1_THRESHOLD = 21;
const DAYS_WITHOUT_PDI_REVIEW_THRESHOLD = 30;
const PDI_LOW_PROGRESS_THRESHOLD = 30; // percent

// ─────────────────────────────────────────────────────────────────────────────
// Core Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collects all pending issues for every collaborator under the given manager.
 * Returns an array of PendingIssue objects (only collaborators with at least one issue).
 */
export async function collectPendingIssues(managerId: string): Promise<PendingIssue[]> {
  const db = await getDb();
  const today = new Date();

  // Fetch the manager's collaborators (excluding managers themselves)
  const collaborators = await db.all(
    `SELECT * FROM collaborators WHERE gestor_id = ? AND LOWER(cargo) NOT LIKE '%gestor%'`,
    [managerId]
  );

  const result: PendingIssue[] = [];

  for (const collab of collaborators) {
    const issues: string[] = [];
    const collabId = String(collab.id);

    // ── 1. PDI & Training Analysis ──────────────────────────────────────────
    const pdis = await db.all(
      `SELECT * FROM pdis WHERE id_colaborador = ?`,
      [collabId]
    );

    const responses = await db.all(
      `SELECT * FROM pdi_responses WHERE id_colaborador = ?`,
      [collabId]
    );

    if (pdis.length === 0 && responses.length === 0) {
      issues.push('Sem PDI ou treinamentos cadastrados no sistema.');
    } else {
      // Analyze PDI Goals & Statuses
      for (const pdi of pdis) {
        const progress = parseFloat(pdi.percentual_conclusao) || 0;
        const status = (pdi.status_pdi || '').toLowerCase();
        const prazo = pdi.data_prazo ? new Date(pdi.data_prazo) : null;
        const ultimaRevisao = pdi.data_ultima_revisao ? new Date(pdi.data_ultima_revisao) : null;

        // Prefer real active training name from pdi_responses if present over generic CSV text
        const pdiName = responses.length > 0 ? responses[0].treinamento_nome : (pdi.objetivo_principal || 'PDI');

        // PDI vencido
        if (prazo && prazo < today && status !== 'concluído' && status !== 'concluido') {
          const daysOverdue = Math.floor((today.getTime() - prazo.getTime()) / 86400000);
          issues.push(
            `PDI em "${pdiName}" vencido há ${daysOverdue} dia(s) (prazo: ${prazo.toLocaleDateString('pt-BR')}).`
          );
        }

        // PDI em atraso ou baixo progresso
        if (status.includes('atras') || progress < PDI_LOW_PROGRESS_THRESHOLD) {
          if (!issues.some((i) => i.includes(pdiName))) {
            issues.push(
              `PDI em "${pdiName}" com progresso baixo: ${Math.round(progress)}%.`
            );
          }
        }

        // PDI sem revisão recente
        if (ultimaRevisao) {
          const daysSinceReview = Math.floor(
            (today.getTime() - ultimaRevisao.getTime()) / 86400000
          );
          if (daysSinceReview > DAYS_WITHOUT_PDI_REVIEW_THRESHOLD) {
            issues.push(
              `PDI em "${pdiName}" sem revisão do gestor há ${daysSinceReview} dia(s).`
            );
          }
        } else {
          issues.push(
            `PDI em "${pdiName}" nunca revisado pelo gestor.`
          );
        }
      }

      // Analyze specific PDI Training Responses
      for (const resp of responses) {
        const trainingName = resp.treinamento_nome;

        // Efficacy check
        if (!resp.q4_eficacia || resp.q4_eficacia.trim() === '' || resp.q4_eficacia.toLowerCase() === 'não') {
          if (!issues.some((i) => i.includes(trainingName) && i.includes('eficácia'))) {
            issues.push(
              `Treinamento "${trainingName}" sem avaliação de eficácia.`
            );
          }
        }

        // Practical application check
        if (resp.aplicou_no_trabalho && resp.aplicou_no_trabalho.toLowerCase() === 'não') {
          if (!issues.some((i) => i.includes(trainingName) && i.includes('aplicação'))) {
            issues.push(
              `Treinamento "${trainingName}" não foi aplicado na prática no trabalho.`
            );
          }
        }
      }
    }

    // Only include collaborators that have at least one issue
    if (issues.length > 0) {
      result.push({
        collaboratorId: collabId,
        collaboratorName: collab.nome,
        role: collab.cargo,
        issues,
      });
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Report Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a rich HTML email body for the weekly pending report.
 */
export function buildReportHtml(
  managerName: string,
  pendingIssues: PendingIssue[],
  reportDate: Date = new Date()
): string {
  const formattedDate = reportDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalIssues = pendingIssues.reduce((acc, p) => acc + p.issues.length, 0);

  const collaboratorsSection =
    pendingIssues.length === 0
      ? `<div style="text-align:center;padding:40px 0;color:#22c55e;font-size:18px;">
           <strong>Nenhuma pendência encontrada!</strong><br/>
           <span style="font-size:14px;color:#666;">Todos os colaboradores estão em dia.</span>
         </div>`
      : pendingIssues
        .map(
          (p) => `
          <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <!-- Collaborator Header -->
            <div style="background:#1e293b;padding:14px 20px;display:flex;align-items:center;gap:12px;">
              <img
                src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.collaboratorName)}&background=6366f1&color=fff&size=36"
                style="border-radius:50%;width:36px;height:36px;"
                alt="${p.collaboratorName}"
              />
              <div>
                <div style="color:#f1f5f9;font-weight:700;font-size:15px;">${p.collaboratorName}</div>
                <div style="color:#94a3b8;font-size:12px;">${p.role}</div>
              </div>
              <div style="margin-left:auto;background:#ef4444;color:white;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;">
                ${p.issues.length} pendência(s)
              </div>
            </div>
            <!-- Issues List -->
            <div style="padding:16px 20px;background:#ffffff;">
              <ul style="margin:0;padding-left:20px;list-style:none;">
                ${p.issues.map((issue) => `<li style="padding:6px 0;border-bottom:1px solid #f1f5f9;color:#374151;font-size:13px;line-height:1.4;">• ${issue}</li>`).join('')}
              </ul>
            </div>
          </div>`
        )
        .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório Semanal de Pendências</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <div style="font-size:13px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">PDI Inova</div>
              <h1 style="margin:0;color:#f1f5f9;font-size:26px;font-weight:700;">Relatório Semanal de Pendências</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${formattedDate}</p>
            </td>
          </tr>

          <!-- Greeting + Summary -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 24px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Olá, <strong>${managerName}</strong>!
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Este é o seu relatório automático semanal com um resumo das situações que precisam de atenção no seu time.
                Confira as pendências listadas abaixo e tome as ações necessárias para manter o desenvolvimento do seu time em dia.
              </p>

              <!-- Stats Bar -->
              <div style="display:flex;gap:16px;margin-bottom:8px;">
                <div style="flex:1;background:#f1f5f9;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:28px;font-weight:700;color:#1e293b;">${pendingIssues.length}</div>
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Colaboradores<br/>com pendências</div>
                </div>
                <div style="flex:1;background:#fef3c7;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:28px;font-weight:700;color:#d97706;">${totalIssues}</div>
                  <div style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:1px;">Total de<br/>pendências</div>
                </div>
                <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:20px;font-weight:700;color:#16a34a;padding-top:6px;">PDI Hub</div>
                  <div style="font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:1px;">Acesse o<br/>Dashboard</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Collaborators Section -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px 32px;">
              <h2 style="margin:0 0 20px;color:#1e293b;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                Detalhamento por Colaborador
              </h2>
              ${collaboratorsSection}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <a
                href="http://localhost:5173"
                style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;"
              >
                Acessar PDI Hub
              </a>
              <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
                Este e-mail é gerado automaticamente toda segunda-feira às 07:00 pelo sistema PDI Inova.<br/>
                Você recebe este relatório pois é gestor de equipe na plataforma.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                © ${new Date().getFullYear()} PDI Inova · Relatório Semanal Automatizado
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends the weekly pending report to a single manager.
 * Looks up the manager's email from the users table using their collaborator ID.
 */
export async function sendWeeklyReportToManager(
  managerId: string
): Promise<WeeklyReportResult> {
  const db = await getDb();

  // Look up manager data
  const manager = await db.get(
    `SELECT u.email, c.nome FROM users u
     LEFT JOIN collaborators c ON u.collab_id = c.id
     WHERE u.collab_id = ?`,
    [managerId]
  );

  const managerEmail = manager?.email || managerId;
  const managerName = manager?.nome || 'Gestor';

  const result: WeeklyReportResult = {
    managerEmail,
    managerId,
    collaboratorsAnalyzed: 0,
    totalIssues: 0,
    sent: false,
    status: 'failed',
  };

  try {
    console.log(`[WeeklyReport] Analyzing manager: ${managerEmail} (ID: ${managerId})`);

    // Collect issues
    const pendingIssues = await collectPendingIssues(managerId);
    const allCollaborators = await db.all(
      `SELECT id FROM collaborators WHERE gestor_id = ? AND LOWER(cargo) NOT LIKE '%gestor%'`,
      [managerId]
    );

    result.collaboratorsAnalyzed = allCollaborators.length;
    result.totalIssues = pendingIssues.reduce((acc, p) => acc + p.issues.length, 0);

    // Build HTML
    const subject = `Relatório Semanal de Pendências — ${new Date().toLocaleDateString('pt-BR')}`;
    const htmlBody = buildReportHtml(managerName, pendingIssues);

    // Send email
    const sent = await sendEmail(managerEmail, managerEmail, subject, htmlBody);

    result.sent = sent;
    result.status = sent ? (isMockMode() ? 'mock' : 'sent') : 'failed';

    // Persist log
    await db.run(
      `INSERT INTO weekly_report_log
         (manager_email, manager_id, sent_at, issues_count, collaborators_count, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        managerEmail,
        managerId,
        new Date().toISOString(),
        result.totalIssues,
        result.collaboratorsAnalyzed,
        result.status,
      ]
    );

    console.log(
      `[WeeklyReport] Done for ${managerEmail}: ${result.totalIssues} issues across ${result.collaboratorsAnalyzed} collaborators. Status: ${result.status}`
    );
  } catch (error) {
    const errMsg = (error as Error).message;
    console.error(`[WeeklyReport] Error for manager ${managerEmail}:`, errMsg);
    result.errorMessage = errMsg;
    result.status = 'failed';

    try {
      await db.run(
        `INSERT INTO weekly_report_log
           (manager_email, manager_id, sent_at, issues_count, collaborators_count, status, error_message)
         VALUES (?, ?, ?, 0, 0, 'failed', ?)`,
        [managerEmail, managerId, new Date().toISOString(), errMsg]
      );
    } catch (_) {
      // Ignore log errors
    }
  }

  return result;
}

/**
 * Iterates over all managers who have their Outlook connected and sends
 * the weekly report to each one.
 * Managers without an Outlook token are skipped (logged as a warning).
 */
export async function runWeeklyReportForAllManagers(): Promise<WeeklyReportResult[]> {
  const db = await getDb();

  console.log('\n[WeeklyReport] ─── Starting weekly report job ───');

  // Find all users who are managers (have subordinates)
  // In mock mode, we don't require JOIN outlook_tokens since mock emails don't require stored tokens.
  const query = isMockMode()
    ? `SELECT DISTINCT c.gestor_id as managerId, u.email as managerEmail
       FROM collaborators c
       JOIN users u ON u.collab_id = c.gestor_id
       WHERE c.gestor_id IS NOT NULL AND c.gestor_id != ''`
    : `SELECT DISTINCT c.gestor_id as managerId, u.email as managerEmail
       FROM collaborators c
       JOIN users u ON u.collab_id = c.gestor_id
       JOIN outlook_tokens ot ON ot.email = u.email
       WHERE c.gestor_id IS NOT NULL AND c.gestor_id != ''`;

  const managers = await db.all(query);

  if (managers.length === 0) {
    console.warn('[WeeklyReport] No managers found. Skipping all.');
    return [];
  }

  console.log(`[WeeklyReport] Found ${managers.length} manager(s) with Outlook connected.`);

  const results: WeeklyReportResult[] = [];
  for (const mgr of managers) {
    const result = await sendWeeklyReportToManager(mgr.managerId);
    results.push(result);
  }

  const sent = results.filter((r) => r.status === 'sent' || r.status === 'mock').length;
  console.log(
    `[WeeklyReport] ─── Job complete: ${sent}/${results.length} reports dispatched ───\n`
  );

  return results;
}
