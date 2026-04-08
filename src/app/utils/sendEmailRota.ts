import nodemailer from "nodemailer";
import ejs from "ejs";

export const sendEmailRota = async (props: {
  to: string;
  subject: string;
  companyName: string;
  companyImage: string;
  username: string;
  description: string;
  date: string;
  address: string;
  cityOrTown: string;
  stateOrProvince: string;
  country: string;
  postCode: string;
}) => {
  const { 
    to, subject, companyName, companyImage, username, 
    description, date, address, cityOrTown, stateOrProvince, 
    country, postCode 
  } = props;

  const transporter = nodemailer.createTransport({
    host: "smtp.ionos.co.uk",
    port: 587,
    secure: false,
    auth: {
      user: "contact@cyberpeers.co.uk",
      pass: "4FROdCo?!)tT",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const html = await ejs.renderFile(
      __dirname + "/../static/email_template/rota_template.ejs",
      { 
        companyName, 
        companyImage, 
        username, 
        description, 
        date,
        address,           
        cityOrTown,        
        stateOrProvince,   
        country,           
        postCode           
      }
    );

    const info = await transporter.sendMail({ 
      from: `"${companyName}" <contact@cyberpeers.co.uk>`, 
      to, 
      subject, 
      html 
    });
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};