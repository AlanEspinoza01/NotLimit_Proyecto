import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAccountNav } from '../components/layout/accountNav.ts';

test('GUEST_USER existe pero muestra Iniciar sesión y navega a /auth', () => {
  const guestUser = { id: 'guest_user', name: 'Invitado', role: 'guest' };
  assert.deepEqual(resolveAccountNav(false, guestUser), {
    to: '/auth', label: 'Iniciar sesión', title: 'Iniciar sesión'
  });
});

test('Sin objeto de usuario también muestra Iniciar sesión', () => {
  assert.equal(resolveAccountNav(false, null).label, 'Iniciar sesión');
});

test('Cuenta autenticada muestra firstName, y abre el perfil', () => {
  assert.deepEqual(resolveAccountNav(true, { firstName: 'Rega', name: 'Rega Liss' }), {
    to: '/profile', label: 'Rega', title: 'Mi perfil'
  });
});

test('Cuenta autenticada sin firstName utiliza name', () => {
  assert.equal(resolveAccountNav(true, { name: 'Rega Liss' }).label, 'Rega');
});

test('Cuenta autenticada con nombres vacíos muestra Mi cuenta', () => {
  assert.equal(resolveAccountNav(true, { firstName: '  ', name: '  ' }).label, 'Mi cuenta');
});
