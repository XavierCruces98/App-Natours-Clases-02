// node "src/1utilidades/sendEmailTest.js"
const nodemailer = require('nodemailer'); // SI es un NPM
const pug = require('pug');
const htmlToText = require('html-to-text');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0; // esto es importante, porque sino , no te permitira enviar nada y ademas que da error al SIGNUP

class EmailTrap {
  constructor(usuario, url) {
    this.remitente = `Xavier Huaman <${process.env.EMAIL_EMPRESA}>`; // correo origen
    this.to = usuario.email; // correo destino
    this.primerNombre = usuario.nombre.split(' ')[0];
    this.url = url;
  }

  nuevoTransporte() {
    if (process.env.NODE_EN === 'production') return true;

    return nodemailer.createTransport({
      //service:'gmail', // 'gmail'
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER, // el email remitente (origen)
        pass: process.env.EMAIL_PASSWORD, // el email remitente (origen) // password de app (verificacion en dos pasos ON)
      },
    });
    //return await transporte.sendMail(options);
  }

  async enviarEmail(template, asunto) {
    const plantilla = `${__dirname}/../../public/plantillaEmail/${template}.pug`;
    const variablesLocales = {
      // va directo a "archivo.pug"
      primerNombre: this.primerNombre,
      url: this.url,
      asunto: asunto,
    };
    const html = pug.renderFile(plantilla, variablesLocales); // OK

    const emailOpciones = {
      from: this.remitente,
      to: this.to,
      subject: asunto,
      //text: htmlToText.fromString(html),
      text: htmlToText.convert(html),
      html: html,
    };

    await this.nuevoTransporte().sendMail(emailOpciones);
    console.log(`----------EmailTrap enviado ! ${asunto}------------`);
  }

  sendWelcome() {
    // "bienvenido.pug"
    this.enviarEmail('bienvenido', 'Verifica tu Cuenta! solo tienes 10min');
  }

  sendResetPassword() {
    // "resetPassword.pug"
    this.enviarEmail(
      'resetPassword',
      'Recupera tu Password! solo tienes 10min'
    );
  }
}
module.exports = EmailTrap;

// module.exports.emailTrap = async function (options) {
//   const transporte = nodemailer.createTransport({
//     //service:'gmail', // 'gmail'
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER, // el email remitente (origen)
//       pass: process.env.EMAIL_PASSWORD, // el email remitente (origen) // password de app (verificacion en dos pasos ON)
//     },
//   });

//   return await transporte.sendMail(options);

//   // esta forma tambien sirve
//   // --------------------------------------------------------------
//   // await transporte.sendMail(options, (error, info) => {
//   //   if (error) console.log(error);
//   //   else {
//   //     console.log(`correo enviado`);
//   //     console.log(info);
//   //   }
//   // });
//   // ------------------------------------------------------------
// };
