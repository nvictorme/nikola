import sendgrid from "@sendgrid/mail";

export interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

const {
  APP_NAME,
  SITE_URL,
  NO_REPLY_EMAIL_ADDRESS = "noreply@email.com",
  SENDGRID_API_KEY = "SENDGRID_APY_KEY",
} = process.env;
sendgrid.setApiKey(SENDGRID_API_KEY);

export const sendEmail = async (
  from: string = NO_REPLY_EMAIL_ADDRESS,
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
  attachments?: EmailAttachment[]
) => {
  let message = {
    from,
    to,
    subject,
    text,
    html: html ?? text,
  };
  // if there is at least 1 attachment
  if (attachments?.length) {
    Object.assign(message, { attachments });
  }
  if (typeof to === "string") {
    return await sendgrid.send(message);
  } else if (Array.isArray(to)) {
    return await sendgrid.sendMultiple(message);
  }
};

export const emailPasswordResetLink = async (
  email: string,
  hash: string,
  resetToken: string
) => {
  const subject = `${APP_NAME} - Restablecer contraseña.`;
  let content = `<p>Por favor, haga click en el siguiente enlace para restablecer su contraseña:</p>`;
  content += `<br><a href="${SITE_URL}/reset?hash=${hash}&token=${resetToken}" target="_blank"><h2>Restablecer mi contraseña</h2></a>`;
  return await sendEmail(undefined, email, subject, content);
};

export const emailInviteLink = async ({
  email,
  firstName,
  companyName,
  token,
}: {
  email: string;
  firstName: string;
  companyName: string;
  token: string;
}) => {
  const subject = `${companyName} - Te ha invitado a unirte a su equipo.`;
  let content = `<p>Hola ${firstName}, por favor haz click en el siguiente enlace para unirte a ${companyName}:</p>`;
  content += `<br><a href="${SITE_URL}/users/invite/${token}" target="_blank"><h2>Unirme a ${companyName}</h2></a>`;
  return await sendEmail(undefined, email, subject, content);
};

export const emailWelcome = async ({
  email,
  password,
  firstName,
  companyName,
}: {
  email: string;
  password: string;
  firstName: string;
  companyName: string;
}) => {
  const subject = `¡Bienvenid@ a ${companyName}!`;
  let content = `<p>Hola ${firstName}, bienvenid@ a ${companyName}.</p>`;
  content += `<br><p>Ya puedes acceder a tu cuenta en <a href="${SITE_URL}" target="_blank">${SITE_URL}</a>.</p>`;
  content += `<br><p>E-mail: ${email}</p>`;
  content += `<br><p>Contraseña: ${password}</p>`;
  content += `<br><p>Recuerda que puedes cambiar tu contraseña en la sección de configuración de tu cuenta.</p>`;
  return await sendEmail(undefined, email, subject, content);
};
