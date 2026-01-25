/**
 * Email Service using Resend
 * Handles sending confirmation emails and weekly newsletters
 */

import { Resend } from "resend";
import logger from "../lib/logger";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Flash Info Afrique <newsletter@flashinfoafrique.com>";
const siteUrl = process.env.SITE_URL || "https://flashinfoafrique.com";

// Create Resend instance (will be null if no API key)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return resend !== null;
}

/**
 * Send a confirmation email to a new newsletter subscriber
 */
export async function sendConfirmationEmail(
  email: string,
  confirmationToken: string
): Promise<boolean> {
  if (!resend) {
    logger.warn("Email service not configured - skipping confirmation email", { email });
    return false;
  }

  const confirmationUrl = `${siteUrl}/api/newsletter/confirm?token=${confirmationToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre inscription - Flash Info Afrique</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Flash Info Afrique</h1>
              <p style="margin: 10px 0 0; color: #E0E7FF; font-size: 14px;">L'actualité économique et financière de la zone UEMOA</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1E3A8A; font-size: 24px;">Confirmez votre inscription</h2>
              <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 30px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Merci de votre intérêt pour notre newsletter hebdomadaire ! Pour confirmer votre inscription et commencer à recevoir nos actualités chaque vendredi, veuillez cliquer sur le bouton ci-dessous :
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Confirmer mon inscription
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 0 0 30px; color: #3B82F6; font-size: 14px; word-break: break-all;">
                <a href="${confirmationUrl}" style="color: #3B82F6;">${confirmationUrl}</a>
              </p>
              
              <p style="margin: 0; color: #9CA3AF; font-size: 13px; line-height: 1.6;">
                Ce lien expire dans 48 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #6B7280; font-size: 13px; text-align: center;">
                Flash Info Afrique - Votre source d'information économique et financière
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                <a href="${siteUrl}" style="color: #3B82F6; text-decoration: none;">flashinfoafrique.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Confirmez votre inscription à la newsletter Flash Info Afrique

Bonjour,

Merci de votre intérêt pour notre newsletter hebdomadaire ! Pour confirmer votre inscription et commencer à recevoir nos actualités chaque vendredi, veuillez cliquer sur le lien ci-dessous :

${confirmationUrl}

Ce lien expire dans 48 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.

---
Flash Info Afrique
L'actualité économique et financière de la zone UEMOA
${siteUrl}
`;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Confirmez votre inscription à la newsletter Flash Info Afrique",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      logger.error("Failed to send confirmation email", { email, error });
      return false;
    }

    logger.info("Confirmation email sent", { email });
    return true;
  } catch (error) {
    logger.error("Error sending confirmation email", { email }, error);
    return false;
  }
}

/**
 * Article type for newsletter
 */
interface NewsletterArticle {
  title: string;
  excerpt: string;
  slug: string;
  category?: string;
  imageUrl?: string;
  publishedAt: string;
}

/**
 * Send weekly newsletter to a subscriber
 */
export async function sendWeeklyNewsletter(
  email: string,
  articles: NewsletterArticle[],
  unsubscribeToken?: string
): Promise<boolean> {
  if (!resend) {
    logger.warn("Email service not configured - skipping newsletter", { email });
    return false;
  }

  const unsubscribeUrl = unsubscribeToken 
    ? `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`
    : `${siteUrl}`;

  // Generate articles HTML
  const articlesHtml = articles.map(article => `
    <tr>
      <td style="padding: 20px 0; border-bottom: 1px solid #E5E7EB;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            ${article.imageUrl ? `
            <td style="width: 120px; vertical-align: top; padding-right: 20px;">
              <img src="${article.imageUrl}" alt="" style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px;" />
            </td>
            ` : ''}
            <td style="vertical-align: top;">
              ${article.category ? `<span style="display: inline-block; padding: 4px 12px; background-color: #E0E7FF; color: #1E3A8A; font-size: 12px; font-weight: 600; border-radius: 20px; margin-bottom: 8px;">${article.category}</span>` : ''}
              <h3 style="margin: 0 0 8px; font-size: 18px;">
                <a href="${siteUrl}/article/${article.slug}" style="color: #1E3A8A; text-decoration: none;">${article.title}</a>
              </h3>
              <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.5;">${article.excerpt || ''}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const dateRange = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Flash Info Afrique</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Flash Info Afrique</h1>
              <p style="margin: 10px 0 0; color: #E0E7FF; font-size: 14px;">Newsletter Hebdomadaire</p>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 12px;">${dateRange}</p>
            </td>
          </tr>
          
          <!-- Intro -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 15px 0 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Voici les ${articles.length} article${articles.length > 1 ? 's' : ''} marquant${articles.length > 1 ? 's' : ''} de la semaine dans l'actualité économique et financière de la zone UEMOA :
              </p>
            </td>
          </tr>
          
          <!-- Articles -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${articlesHtml}
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 30px 40px;">
              <a href="${siteUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px;">
                Voir tous les articles
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #6B7280; font-size: 13px; text-align: center;">
                Flash Info Afrique - Votre source d'information économique et financière
              </p>
              <p style="margin: 0 0 15px; color: #9CA3AF; font-size: 12px; text-align: center;">
                <a href="${siteUrl}" style="color: #3B82F6; text-decoration: none;">flashinfoafrique.com</a>
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 11px; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #9CA3AF; text-decoration: underline;">Se désinscrire de la newsletter</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const articlesList = articles.map(a => `- ${a.title}\n  ${siteUrl}/article/${a.slug}`).join('\n\n');
  
  const textContent = `
Newsletter Flash Info Afrique - ${dateRange}

Bonjour,

Voici les ${articles.length} article${articles.length > 1 ? 's' : ''} marquant${articles.length > 1 ? 's' : ''} de la semaine :

${articlesList}

---
Voir tous les articles : ${siteUrl}

Flash Info Afrique
L'actualité économique et financière de la zone UEMOA

Se désinscrire : ${unsubscribeUrl}
`;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Newsletter Flash Info Afrique - ${articles.length} article${articles.length > 1 ? 's' : ''} cette semaine`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      logger.error("Failed to send newsletter", { email, error });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error sending newsletter", { email }, error);
    return false;
  }
}

/**
 * Send newsletters in batch to multiple subscribers
 */
export async function sendBatchNewsletters(
  subscribers: Array<{ email: string; unsubscribeToken?: string }>,
  articles: NewsletterArticle[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const success = await sendWeeklyNewsletter(subscriber.email, articles, subscriber.unsubscribeToken);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info("Batch newsletter sending completed", { sent, failed, total: subscribers.length });
  return { sent, failed };
}

export default {
  isEmailServiceConfigured,
  sendConfirmationEmail,
  sendWeeklyNewsletter,
  sendBatchNewsletters,
};
