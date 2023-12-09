//const axios = require('axios'); // esto no se puede
// debes de hacer funcionar SI o SI a axios, sino, te dara error
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import { mostrarAlerta } from './alerta.js';

export const logout = async function () {
  try {
    // 1) haces una REQUEST con axios() a una API' http://localhost:3000/api/v1/users/logout',
    // 2) Y recibiras una respuesta RESPONSE
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    console.log(response.data);

    if (response.data.status === 'success logout') {
      mostrarAlerta('success', 'Has cerrado Sesion ❗');
      window.setTimeout(() => {
        window.location.replace('/home');
      }, 1000); // 1.0 segundos
    }
  } catch (error) {
    mostrarAlerta('error', 'Ha sucedido un error 😥');
    console.log(error);
  }
};

export const login = async function (email, password) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: { email, password },
    });

    console.log(response.data);

    if (response.data.status === 'success POST login') {
      mostrarAlerta('success', 'Login Exitoso ❗');
      window.setTimeout(() => {
        window.location.replace('/me');
      }, 1500); // 1.5 segundos
    }
  } catch (error) {
    console.log(error.response.data.message);

    // 3) Lo malo de esto, es que si pasa 10min despues del correo, entonces estas frito, saldra "email o password incorrecto"
    if (error.response.data.message === '4.0 No ha confirmado su EMAIL') {
      mostrarAlerta('error', 'No ha confirmado su EMAIL ❗');
    } else {
      mostrarAlerta('error', 'Email o password Incorrecto');
    }
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
      url: 'http://localhost:3000/api/v1/users/signup',
      data: { nombre, email, password, passwordConfirm },
    });

    console.log(response.data);

    if (response.data.status === 'Success Signup') {
      mostrarAlerta('success', 'Signup Exitoso ❗');
      window.setTimeout(() => {
        window.location.replace('/emailEnviado');
      }, 1500); // 1.5 segundos
    }
  } catch (error) {
    mostrarAlerta('error', 'Ha sucedido un error 😥 ❗');
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
