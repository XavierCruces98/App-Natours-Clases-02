//const axios = require('axios'); // esto no se puede
// debes de hacer funcionar SI o SI a axios, sino, te dara error
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

export const logout = async function () {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const login = await fetch(
    'http://localhost:3000/api/v1/users/logout',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta.status);

  if (respuesta.status === 'sucess logout') {
    window.location.replace('/home');
  }
};

export const login = async function (email, password) {
  // const headers = {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ email, password }),
  // };

  // const login = await fetch(
  //   'http://localhost:3000/api/v1/users/login',
  //   headers
  // );

  // const respuesta = await login.json();
  // console.log(respuesta);

  try {
    const login = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: { email, password },
    });

    // const respuesta = await login.data;
    console.log(login.data);

    if (login.data.status === 'sucess POST login') {
      window.setTimeout(() => {
        window.location.replace('/me');
      }, 1500); // 1.5 segundos
    }
  } catch (error) {
    console.log(error);
  }
};

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
