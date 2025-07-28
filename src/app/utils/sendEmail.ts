import nodemailer from "nodemailer";
import ejs from "ejs";
import config from "../config";

export const sendEmail = async (
  to: string,
  template: string,
  subject: string,
  username: string,
  otp?: string
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.gmail.com",
    port: 587,
    secure: false,

    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: "noreply@taskplanner.co.uk",
      pass: "ddgc rryi lucp ckwx",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  ejs.renderFile(
    __dirname + "/../static/email_template/" + template + ".ejs",
    {
      name: username,
      next_action: "https://taskplanner.co.uk/login",
      support_url: "https://taskplanner.co.uk",
      action_url: "https://taskplanner.co.uk/login",
      login_url: "https://taskplanner.co.uk/login",
      username,
      otp,
    },
    function (err: any, data: any) {
      if (err) {
        console.log(err);
      } else {
        var mainOptions = {
          from: "noreply@taskplanner.co.uk",
          to,
          subject,
          html: data,
        };
        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log("Message sent: " + info.response);
          }
        });
      }
    }
  );
};
