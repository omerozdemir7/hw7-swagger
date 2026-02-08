import nodemailer from 'nodemailer';

let transport;

const getTransport = () => {
  if (transport) return transport;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  const port = Number(SMTP_PORT);

  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transport;
};

export const sendEmail = async (data) => {
  const email = { ...data, from: process.env.SMTP_FROM };
  await getTransport().sendMail(email);
};

export default sendEmail;

