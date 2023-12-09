// node "src/1utilidades/sendEmailTest.js"
const nodemailer = require('nodemailer'); // SI es un NPM
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0; // esto es importante, porque sino , no te permitira enviar nada y ademas que da error al SIGNUP

const sendEmail = async function (options) {
  const transporte = nodemailer.createTransport({
    //service:'gmail', // 'gmail'
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER, // el email remitente (origen)
      pass: process.env.EMAIL_PASSWORD, // el email remitente (origen) // password de app (verificacion en dos pasos ON)
    },
  });

  return await transporte.sendMail(options)

  // esta forma tambien sirve
  // --------------------------------------------------------------
  // await transporte.sendMail(options, (error, info) => {
  //   if (error) console.log(error);
  //   else {
  //     console.log(`correo enviado`);
  //     console.log(info);
  //   }
  // });
  // ------------------------------------------------------------
};

module.exports = sendEmail;
