import nodemailer from 'nodemailer';
import ejs from 'ejs';
import config from '../config';

export const sendEmail = async (to: string, from: string, subject: string, host:string, port:Number,secure:boolean,body:string,password: string) => {
  const transporter = nodemailer.createTransport({
    // host: 'smtp.ionos.co.uk',
    // port: 587,
    // secure: false, 
    host,
    port:Number(port),
    secure:secure, 
    
    auth: {
      user: from, 
      pass: password,
    },

  });

  try {
    const html = await ejs.renderFile(
      __dirname + "/../static/email_template/" + "welcome_template" + ".ejs",
      {  body: body }
    );

    const mailOptions = {
      from, 
      to, 
      subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};