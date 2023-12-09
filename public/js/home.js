// const api = require('./controlador/api.js');
import * as api from './controlador/api.js';
import { mostrarAlerta } from './controlador/alerta.js';

const botonLogout = document.querySelector('#btn-logout');

if (window.location.pathname.includes('confirmarEmail')) {
  window.setTimeout(function () {
    window.location.replace('/home');
  }, 1500);
}

if (window.location.pathname === '/login') await formLogin();
if (window.location.pathname === '/signup') await formSignup();
if (botonLogout) await btnLogout();

async function btnLogout() {
  botonLogout.addEventListener('click', async function (e) {
    e.preventDefault();
    await api.logout();
    console.log(`salir`);
  });
}

async function formLogin() {
  const login = document.querySelector('#formulario-login');

  //recuerda que aqui es "submit" y no es "click"
  login.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const regex =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (!regex.test(email) || password === '') {
      return;
    }

    console.log(` FORMULARIO LOGIN`, { email, password });
    await api.login(email, password);
  });
}

async function formSignup() {
  const signup = document.querySelector('#formulario-signup');

  // recuerda que aqui es "submit" y no es "click"
  signup.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.querySelector('#nombre').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;

    const regexNombre = /^[A-Za-z\s]+$/;
    // const regexEmail = // el html ya valida @correos creo
    //   /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (!regexNombre.test(nombre) || password === '') return;

    if (password !== passwordConfirm) {
      mostrarAlerta('error', 'Los Password nos coinciden ❗');
      return; // El return es importante para que no continue
    }

    console.log(` FORMULARIO SIGNUP`, {
      nombre,
      email,
      password,
      passwordConfirm,
    });

    await api.signup(nombre, email, password, passwordConfirm);
  });
}

//---------------------------------------------------------------------------
