
// para crear el archivo ---bundle.js y bundle.js.map--- basta con escribir ___npm run watch:js___
// asegurate de tener 02 terminales abiertas a la vez "npm run start:dev" y "npm run watch:js"
import * as api from './controlador/api.js';
import { crearMapaBox } from './crearMapaBox.js';
import '@babel/polyfill'; // esto es un paso opcional, si quitas esto funciona igual,
// con esto incluido sale una alerta de " Content Security Policy  "default-src 'self' https://*.mapbox.com https://cdn.jsdelivr.net".", pero todo funciona ok



const botonLogout = document.querySelector('#btn-logout');
const mapa = document.querySelector('#mapa');
const menuUsuario = document.querySelector('.usuario-vista');

if (window.location.pathname.includes('confirmarEmail')) {
  window.setTimeout(function () {
    window.location.replace('/home');
  }, 2000); //2segundos
}

if (window.location.pathname === '/login') formLogin();
if (window.location.pathname === '/signup') formSignup();
if (botonLogout) btnLogout();
if (mapa) crearMapaBox(mapa);
if (menuUsuario) formUpdate();

async function btnLogout() {
  botonLogout.addEventListener('click', async function (e) {
    e.preventDefault();
    await api.logout();
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

    console.log(`FORMULARIO LOGIN`, { email, password });
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

    console.log(`FORMULARIO SIGNUP`, {
      nombre,
      email,
      password,
      passwordConfirm,
    });

    await api.signup(nombre, email, password, passwordConfirm);
  });
}

//---------------------------------------------------------------------------
async function formUpdate() {
  // document
  //   .querySelector('#cambiarNombreEmail')
  //   .addEventListener('submit', async function (e) {
  //     e.preventDefault();
  //     const nombre = document.querySelector('#nombre').value;
  //     const email = document.querySelector('#email').value;
  //     console.log({ email, nombre });
  //     await api.updatePerfil(email, nombre);
  //   });

  document
    .querySelector('#cambiarPassword')
    .addEventListener('submit', async function (e) {
      e.preventDefault();
      const passActual = document.querySelector('#password-actual').value;
      const passNew = document.querySelector('#password-nuevo').value;
      const passConfirm = document.querySelector('#password-confirm').value;

      console.log({ passActual, passNew, passConfirm });

      await api.updatePassword(passActual, passNew, passConfirm);
    });
}
