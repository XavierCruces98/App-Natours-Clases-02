if (window.location.pathname === '/login') formLogin();

async function formLogin() {
  const login = document.querySelector('#formulario-login');

  login.addEventListener('click', async function (e) {
    e.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const regex =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (!regex.test(email) || password === '') return;

    console.log(` FORMULARIO LOGIN`, { email, password });
    await apiLogin(email, password);
  });
}

async function apiLogin(email, password) {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  };

  const login = await fetch(
    'http://localhost:3000/api/v1/users/login',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta.status);

  if (respuesta.status === 'sucess POST login') {
    window.location.replace('/me');
  }
}
