// const cloneDeep = require('lodash.clonedeep');
// const slugify = require('slugify');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // no es un NPM, es del NODEJS
const localTime = require('../utlidadesPropias/localTime');

const userEsquema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'Necesitas ingresar un USER-nombre'],
      maxlength: [40, 'User-nombre debe tener menos o igual a 40 characters'],
      minlength: [1, 'User-nombre debe tener mas o igual a 1 characters'],
      unique: true,
      trim: true, // si escribes  " hola  que ", se guarda como "hola que", corta los espacios innecesarios
      validate: {
        validator: function (valor) {
          const regex = /^[A-Za-z\s]+$/;
          return regex.test(valor);
        },
        message: `El "NOMBRE" debe tener espacis y caracteres Alpha, sin numeros y caracteres especiales`,
      },
    },

    email: {
      type: String,
      lowercase: true, // todo correo debe estar siempre en minuscula
      required: [true, 'Necesitas ingresar un USER-email'],
      unique: true,
      trim: true,
      validate: {
        //https://regexr.com/3e48o
        validator: function (valor) {
          const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
          return regex.test(valor);
        },
        message: `El "EMAIL" no es valido`,
      },
    },

    photo: {
      type: String,
      //required: [true, 'Necesitas ingresar un USER-photo'],
      trim: true, // si escribes  " hola  que ", se guarda como "hola que", corta los espacios innecesarios
    },

    password: {
      type: String,
      required: [true, 'Necesitas ingresar un USER-password'],
      validate: {
        //https://regexr.com/3e48o
        validator: function (valor) {
          // almenos 8 caracteres, un numero y una letra, (\d [0-9])
          // primero se comprueba el REGEX, "1234567a",
          // si pasa el regex, listo ahora recien se encripta, la encriptacion ya no pasa por regex ".pre("save")"
          // osea, la encriptacion puede guardar el password con caracteres extraños y listo.
          const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
          return regex.test(valor);
        },
        message: `El "PASSWORD" debe contener 8 caracteres, al menos 1 numero ó al menos 1 letra`,
      },
      select: false, // ❗❗❗❗❗❗ si pones "false" , no saldra en ninguna busqueda .findOne(), asi que debes de especificar .findOne({}).select({+password})
    },

    passwordConfirm: {
      type: String,
      required: [true, 'Necesitas ingresar un USER-passwordConfirm'],
      validate: {
        // ❗❗ el "validator" SI SIRVE para::   (POST) DB_USER.create() , DB_USER.save()
        // ❗❗ el "validator" NO sIRVE para::   (PATCH) DB_USER.DB_tour.updateOne() DB_user.findByIdAndUpdate()
        // En caso de que quiera modificar el password,
        // Debes de agregar una logica APARTE para que los password vuelvan  a concididir
        validator: function (valor) {
          return this.password === valor; // true o false
        },
        message: `Los "PASSWORDS" nos coinciden`,
      },
    },
    role: {
      type: String,
      enum: ['admin', 'lider-guia', 'guia', 'user-basico'],
      default: 'user-basico',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    creadoEn: {
      type: Date,
      default: Date.now(),
      // select "TRUE" por defecto, siempre se visualiza
      // select "FALSE", se oculta, y se visualiza esta propiedad SOLO si lo especificas en una consulta,
      select: true,
    },
    // --------- 2.0 +propiedades adicionales
    passwordChange: {
      type: Date,
      //default: DateNow(), //🔴🔴🔴 al momento de resetear los datos, comenta este default, ❗❗❗
    },
    passwordResetToken: {
      type: String,
    },
    passwordTimeReset: {
      type: Date,
    },
    //------------------------------
    emailConfirm: {
      type: Boolean,
      default: false,
      select: false,
    },
    emailResetToken: {
      type: String,
    },
    emailTimeReset: {
      type: Date,
    },

    //---------- 3.0 ❌❌ esto es una propiedad provicional, no es correcto que lo creemos
    // token_signup: {
    //   type: String,
    //   default: '',
    // },
  },
  {
    toJSON: { virtuals: false }, // con true saldra en la visualizacion dos veces el ID
    toObject: { virtuals:false },
  }
);

//-----------------------------------------------------------------------------------------
// con estos comandos reinicias tus datos:
// => npm run importData && npm run deleteData
//-----------------------------------------------------------------------------------------
// 🟢🟢 video 105. Document Middleware, recuerda, solo funciona con .save() y .create(), NO con .createMany()
// 🟢🟢 video127, guardar "password" de forma encriptada ===> "bcrypt" con async/await
// nota tener password visibles , sin encriptar, en nuestra base de datos es PELIGROSO,
 
//------------------------------------- 🔴 COMENTAR PARA IMPORTAR DATOS 🔴 -----------------------------------------------------------
// 💻 1.0 Transformado el PASSWORD a ENCRIPTADO (bcrypt) , antes de guardarlo en la base-de-datos

// userEsquema.pre('save', async function (next) {
//   // .isModified("password") === FALSE, si el password NO fue modificado/ NO fue creado, entonces no hacemos nada
//   // .isModified("password") === TRUE, si el password SI fue modificado/ SI fue creado, entonces ENCRIPTAMOS
//   if (!this.isModified('password')) return next();

//   // valor = 10 (default) (encripta bien)
//   // valor = 12 (encripta aun mas pero consume mas cpu)
//   // valor = 16 (encripta mucho mas pero consume mas mas cpu)
//   // si dos usuarios tienen la misma contraseña, el encriptado seguira siendo diferente para cada usuario,

//   this.password = await bcrypt.hash(this.password, 12); // return "$%&&#$" contraseña encriptada
//   this.passwordConfirm = undefined; // --passwordConfirm-- es solo para que el usuario escriba bien su contraseña,

//   console.log(`0.0 [HTTP GET] .pre("save) password encriptado `);
//   next();
// });

//------------------------------------- 🔴 COMENTAR PARA IMPORTAR DATOS 🔴 -----------------------------------------------------------

// 💻 2.0 Modificar la propiedad "passwordChange" solo en el caso de que ---this.isModified("password")---" sea TRUE
// 💻 2.0 si el usuario es nuevo ---this.isNew--- entonces tampoco modificaremos la propiedad "passwordChange"
userEsquema.pre('save', async function (next) {
  //
  console.log({
    passwordCambiado: this.isModified('password'),
    usuarioEsNuevo: this.isNew,
  });
  if (!this.isModified('password') || this.isNew) return next();

  // Le estamos restando 1s, porque se puede demorar en ejecutar esta funcion
  // Y parecera como que el "this.passwordChange" fue cambiado despues de la creacion del JWT
  // leer -- userEsquema.methods.validarCambioContrasena ---
  this.passwordChange = localTime(-1 * 1000);
  next();
});

// 🟢🟢 video 140. todos los documentos con "active:false" no apareceran
// ☝ ""active:false"" significa que el usuario elimino su cuenta y en --DB_user.findOne--  solo encontrara usuarios con "active:true"
// ☝ en "login" ya no puedes iniciar sesion, porque usas el metodo --DB_user.findOne-- para buscar su "email"

userEsquema.pre(/^find/, async function (next) {
  this.find({ active: true });
  // this.find({ active : {$ne:false}}); // que no sean igual a "false", por si es que en algun caso el "active" es undefined, aunque no deberia pasar
  console.log(`-------- filtrando solo active:true ---------`);
  next();
});

//-----------------------------------------------------------------------------------------
// 🟢🟢 video 108. validar datos con PATCH, (updateDato)
// URL: http://127.0.0.1:3000/api/v1/tours/123_aquidebescolocarunID_123
// revisar --controllerTours--

//-----------------------------------------------------------------------------------------
// 🟢🟢 video 130 , validar contraseña encriptada vs contraseña normal
userEsquema.methods.compararPassword = async function (
  passwordNormal,
  passwordEncriptada
) {
  // retorna TRUE o FALSE
  return await bcrypt.compare(passwordNormal, passwordEncriptada);

  // bcrypt.compare(  normal, encriptado ); // debes respetar ese orden
  // test1234 (normal) === ingresado por el usuario
  // #asdqwerqwe# (encriptado) === baseDeDatos
};

userEsquema.methods.validarCambioContrasena = function (timeCreadoJWT) {
  // timeCreadoJWT      === JWTTimeStamp === milisegundos
  // timeCreadoJWT      === segundos
  // timeCreadoJWT*1000 === milisegundos

  // 1.0 Si no existe un cambioDePassword, entonces return false
  if (!this.passwordChange) return false;

  const fechaJWT = new Date(timeCreadoJWT * 1000); // return DATE
  const fechaChange = this.passwordChange; // Date

  console.log({ JWT_creado: fechaJWT, Password_Change: fechaChange });

  // fecha1 JWT_creado      = 2023/12/31
  // fecha2 passwordChange = 2024/01/01
  // NUNCA el "passwordChange" tendra una fecha menor a "JWT_creado"
  // si el "passwordChange" tiene un fecha menor al "JWT_creado" RETURN FALSE

  // si fechaJWT < fechaChange return TRUE    === significa que el "password" SII fue cambio
  // si fechaJWT < fechaChange return FAlSE   === significa que el "password" NOO fue cambiado
  // .getTime() => return (milisegundos)
  return fechaJWT.getTime() < fechaChange.getTime();
};

//-----------------------------------------------------------------------------------------
// 🟢🟢 video 135 , validar contraseña encriptada vs contraseña normal
userEsquema.methods.crearRandomStringYToken = function (resetToken, timeReset) {
  //
  const randomByte = crypto.randomBytes(32);
  const randomString = randomByte.toString('hex');
  const randomToken = crypto
    .createHash('sha256')
    .update(randomString)
    .digest('hex');

  //https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

  // usar "DB_USER.save()" para que las propiedades puedan crearse y guardarse
  // recuerda que en la base de datos, aunque el esquema tenga (passwordResetToken,passwordTimeReset ), no tienen un valor default
  // por ello, seran propiedades que recien vamos a crear
  this[resetToken] = randomToken;
  this[timeReset] = localTime(10 * 60 * 1000); // 10min/s * 60s/ms * 1000ms === 10 minutos ()

  // es equivalente a encriptar con el metodo "hash" de bcrypt
  // randomToken <=> this.password = await bcrypt.hash(this.password, 12);

  // 1.0 randomByte lo generamos (nose guarda)
  // 2.0 randomString, lo devolvemos (se guarda en la URL que enviaremos en el correo)
  // 3.0 randomToken, lo guardamos dentro de las propiedades de la base-de-datos

  return randomString;
};

const User = mongoose.model('table-users', userEsquema); // aqui  poner el nombre que deseamos
module.exports = User;

// ❗❗❗ La propiedad de "id=0,1,2,3,4,5,etc" de "esquemaTour.json" simplemente lo ignora,
// porque no estamos poniendo en nuestra esquema ninguna propiedad que se llame "id"

/*
  //metodo "save"
    userEsquema.pre('save', function (next){}) //previsualizacion del documento
    userEsquema.post('save', function (documento, next){}) //documento guardado

   //metodos "/^find/"
    userEsquema.pre(/^find/, function (next){}) //antes de realizar la consulta
    userEsquema.post(/^find/, function (documento, next){}) //consulta realizada

   //metodos "agregate"
    userEsquema.pre('agreggate, function (next){}) // antes de aggregate
    userEsquema.post('aggregate', function (documento, next){}) // al parecer no existe "post+aggregate"


    ---------------------------------------------------------------------------
    userEsquema.pre('save', function (next) {
      // PRE= solo tienes --next--
      console.log(`1.0 [HTTP GET] .pre("save) previsualizacion del documento`);
      next();
    });

    userEsquema.post('save', function (documento, next) {
      // POST= tienes --documento-- y --next--
      console.log(`2.0 [HTTP GET] .post("save") documento guardado`);
      next();
    });

    //-----------------------------------------------------------------------------------------
    // 🟢🟢 video 106. Query Middleware
    userEsquema.pre(/^find/, function (next) {
      console.log(`1.0 [HTTP POST] .pre("FIND") realizando QueryMiddleware`);
      next();
    });

    userEsquema.post(/^find/, function (documento, next) {
      console.log(`2.0 [HTTP POST] .pre("FIND") consulta realizada`);
      next();
    });
    //-----------------------------------------------------------------------------------------
    // 🟢🟢 video 107. Agreggation Middleware
    // url http://127.0.0.1:3000/api/v1/tours/plan-mensual/2021

    userEsquema.pre('aggregate', function (next) {
      console.log(`1.0 [HTTP GET] .pre("aggregate") `);
      next();
    });

    userEsquema.post('aggregate', function (documento, next) {
      // el post con "aggregate" al parecer no existe
      console.log(`2.0 [HTTP GET] .post("aggregate") `);
      next();
    });
     ---------------------------------------------------------------------------
*/
