//const axios = require('axios'); // esto no se puede
// debes de hacer funcionar SI o SI a axios, sino, te dara error
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import { mostrarAlerta } from './alerta.js';

export const logout = async function () {
  try {
    // 1) haces una REQUEST con axios() a una API' http://localhost:3000/api/v1/users/logout',
    // 2) Y recibiras una respuesta RESPONSE
    const response = await axios({
      method: 'GET',
      // EN PRODUCION el puerto "'http://localhost:3000" ya no funciona, (obivamente porque estas en prod)
      // para cuando uses ---npm run start:prod---
      // url: 'http://localhost:8000/api/v1/users/login',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    console.log(response.data);

    if (response.data.status.startsWith('success')) {
      mostrarAlerta('success', 'Has cerrado Sesion ❗');
      window.setTimeout(() => {
        window.location.replace('/home');
      }, 1000); // 1.0 segundos
    }
  } catch (error) {
    mostrarAlerta('error', error.response.data.message);
    console.log(error);
  }
};

export const login = async function (email, password) {
  try {
    const response = await axios({
      method: 'POST',
      // para cuando uses ---npm run start:prod---
      // url: 'http://localhost:8000/api/v1/users/login',
      url: 'http://localhost:3000/api/v1/users/login',
      data: { email, password },
    });

    console.log(response.data);

    if (response.data.status.startsWith('success')) {
      mostrarAlerta('success', 'Login Exitoso ❗');
      window.setTimeout(() => {
        window.location.replace('/me');
      }, 1500); // 1.5 segundos
    }
  } catch (error) {
    console.log(error.response.data.message);

    // 3) Lo malo de esto, es que si pasa 10min despues del correo, entonces estas frito, saldra "email o password incorrecto"
    mostrarAlerta('error', error.response.data.message);
  }
};

export const signup = async function (
  nombre,
  email,
  password,
  passwordConfirm
) {
  try {
    const response = await axios({
      method: 'POST',
      // para cuando uses ---npm run start:prod---
      // url: 'http://localhost:8000/api/v1/users/login',
      url: 'http://localhost:3000/api/v1/users/signup',
      data: { nombre, email, password, passwordConfirm },
    });

    console.log(response.data);

    if (response.data.status.startsWith('success')) {
      mostrarAlerta('success', 'Signup Exitoso ❗');

      // Aqui ya hemos creado el usuario todo Ok
      // ahora solo falta enviarle el EMAIL
      enviarEmail(email);
    }
  } catch (error) {
    console.log(error);
    mostrarAlerta('error', error.response.data.message);
  }
};

export const enviarEmail = async function (email) {
  try {
    const response = await axios({
      method: 'POST',
      // para cuando uses ---npm run start:prod---
      // url: 'http://localhost:8000/api/v1/users/login',
      url: 'http://localhost:3000/api/v1/users/sendEmail',
      data: { email },
    });
    console.log(response.data);
    if (response.data.status.startsWith('success')) {
      window.setTimeout(() => {
        window.location.replace('/emailEnviado');
      }, 2000); // 2 segundos
    }
  } catch (error) {
    console.log(error);
    mostrarAlerta('error', error.response.data.message);
  }
};

export const updatePassword = async function (
  passwordActual,
  passwordNuevo,
  passwordNuevoConfirm
) {
  try {
    const response = await axios({
      method: 'PATCH', // ESTO ES PATCH PUES,
      // para cuando uses ---npm run start:prod---
      // url: 'http://localhost:8000/api/v1/users/login',
      url: 'http://localhost:3000/api/v1/users/updateMyPassword',
      // en nuestra LOGICA, el nombre de los valores son: passwordActual,passwordNuevo,passwordNuevoConfirm
      // si le cambias el nombre de estas variables dara ERROR
      data: { passwordActual, passwordNuevo, passwordNuevoConfirm },
    });

    console.log(response.data);

    if (response.data.status.startsWith('success')) {
      mostrarAlerta('success', 'Password UPDATE Exitoso ❗');

      window.setTimeout(() => {
        logout(); // queremos cerrar sesion
        //window.location.reload(true); // recargamos para salirnos de la pagina
      }, 1000); // 1.5 segundos
    }
  } catch (error) {
    mostrarAlerta('error', error.response.data.message);
    console.log(error);
  }
};

/*

export const signup = async function (
  nombre,
  email,
  password,
  passwordConfirm
) {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombre, email, password, passwordConfirm }),
  };
  const login = await fetch(
    'http://localhost:3000/api/v1/users/signup',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta);

  if (respuesta.status === 'Success Signup') {
    window.location.replace('/emailEnviado');
  }
};

*/
