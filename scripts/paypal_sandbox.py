#!/usr/bin/env python3
"""Run in the owner's Cloud Shell. Standard library only; never prints credentials."""
import argparse
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid

PROJECT = 'gen-lang-client-0958943545'
HOST = 'https://api-m.sandbox.paypal.com'
SECRETS = ('neuroplaneta-paypal-sandbox-client-id', 'neuroplaneta-paypal-sandbox-client-secret')


class SafeError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def secret(name):
    try:
        result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest',
                                 '--secret=' + name, '--project=' + PROJECT, '--quiet'],
                                capture_output=True, text=True, check=True, timeout=45)
        value = result.stdout.strip()
        if not re.fullmatch(r'[A-Za-z0-9_-]{20,512}', value):
            raise SafeError('El secreto ' + name + ' no contiene una clave con formato valido.')
        return value
    except (subprocess.SubprocessError, OSError):
        raise SafeError('No se pudo leer ' + name + '. Revisa la autorizacion de Cloud Shell y Secret Manager.') from None


def request(path, authorization, body=None, request_id=None):
    # A fixed sandbox host and bounded routes prevent accidentally using live or sending keys elsewhere.
    if not re.fullmatch(r'/v1/(oauth2/token|billing/plans(?:/P-[A-Z0-9]{10,40}|\?page_size=1)?|catalogs/products)', path):
        raise SafeError('Ruta de prueba no permitida.')
    headers = {'Authorization': authorization, 'Content-Type': 'application/json'}
    if path == '/v1/oauth2/token':
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
        data = b'grant_type=client_credentials'
    else:
        data = json.dumps(body).encode() if body is not None else None
    if request_id:
        headers.update({'PayPal-Request-Id': request_id, 'Prefer': 'return=representation'})
    req = urllib.request.Request(HOST + path, data=data, headers=headers)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=25) as response:
            result = json.loads(response.read(2_000_001))
        if not isinstance(result, dict):
            raise ValueError()
        return result
    except urllib.error.HTTPError as error:
        if error.code == 401:
            raise SafeError('PayPal rechazo las claves sandbox. Verifica que Client ID y Secret pertenezcan a NeuroPlaneta Sandbox.') from None
        if error.code == 403:
            raise SafeError('PayPal no autoriza esta operacion sandbox. Revisa los permisos de la aplicacion.') from None
        raise SafeError('PayPal no confirmo la operacion sandbox (HTTP ' + str(error.code) + ').') from None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        raise SafeError('No se pudo confirmar la respuesta de PayPal sandbox. Conserva el estado antes de reintentar.') from None


def authorization(client_id, client_secret):
    basic = base64.b64encode((client_id + ':' + client_secret).encode()).decode()
    result = request('/v1/oauth2/token', 'Basic ' + basic)
    token = result.get('access_token')
    if not isinstance(token, str) or not token or result.get('token_type', '').lower() != 'bearer':
        raise SafeError('PayPal no devolvio una autorizacion sandbox valida.')
    return 'Bearer ' + token


def plan_body(product_id):
    return {'product_id': product_id, 'name': 'NeuroPlaneta Sandbox USD 20 mensual', 'status': 'ACTIVE',
            'billing_cycles': [{'frequency': {'interval_unit': 'MONTH', 'interval_count': 1},
                               'tenure_type': 'REGULAR', 'sequence': 1, 'total_cycles': 0,
                               'pricing_scheme': {'fixed_price': {'value': '20.00', 'currency_code': 'USD'}}}],
            'payment_preferences': {'auto_bill_outstanding': False, 'setup_fee': {'value': '0', 'currency_code': 'USD'},
                                    'setup_fee_failure_action': 'CANCEL', 'payment_failure_threshold': 1}}


def validate_plan(plan):
    expected = plan_body(plan.get('product_id', ''))
    try:
        cycle, = plan['billing_cycles']
        expected_cycle = expected['billing_cycles'][0]
        if not re.fullmatch(r'P-[A-Z0-9]{10,40}', plan['id']) or plan['status'] != 'ACTIVE':
            raise ValueError()
        for key in ('frequency', 'tenure_type', 'total_cycles'):
            if cycle[key] != expected_cycle[key]:
                raise ValueError()
        price = cycle['pricing_scheme']['fixed_price']
        prefs = plan['payment_preferences']
        if price['currency_code'] != 'USD' or not re.fullmatch(r'20(?:\.0{1,2})?', str(price['value'])):
            raise ValueError()
        if prefs['auto_bill_outstanding'] is not False or str(prefs['setup_fee']['value']) not in ('0', '0.0', '0.00'):
            raise ValueError()
        if prefs.get('payment_failure_threshold') != 1 or plan.get('quantity_supported', False) is not False or str(plan.get('taxes', {}).get('percentage', '0')) not in ('0', '0.0', '0.00'):
            raise ValueError()
    except (KeyError, TypeError, ValueError):
        raise SafeError('El plan sandbox no coincide con USD 20 mensuales sin cargos adicionales.') from None


def save_state(path, state):
    temporary = path.with_suffix('.tmp')
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        json.dump(state, output)
        output.flush()
        os.fsync(output.fileno())
    os.replace(temporary, path)


def create_plan(auth, fingerprint):
    directory = Path.home() / '.local/state/neuroplaneta-paypal-sandbox'
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = directory / 'plan.json'
    with open(directory / 'setup.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if path.exists():
            state = json.loads(path.read_text())
            if state.get('fingerprint') != fingerprint:
                raise SafeError('Las claves pertenecen a otra aplicacion. Conserva el estado y revisa la configuracion.')
        else:
            state = {'fingerprint': fingerprint, 'request_id': str(uuid.uuid4()), 'created_at': time.time()}
            save_state(path, state)
        if not state.get('plan_id'):
            if time.time() - state['created_at'] > 72 * 3600:
                raise SafeError('El intento incompleto tiene mas de 72 horas. Revisar PayPal antes de crear otro plan.')
            if not state.get('product_id'):
                product = request('/v1/catalogs/products', auth,
                                  {'name': 'NeuroPlaneta Sandbox', 'description': 'Acompanamiento, entretenimiento y practica con supervision adulta.',
                                   'type': 'SERVICE', 'category': 'SOFTWARE'}, state['request_id'] + 'p')
                if not re.fullmatch(r'PROD-[A-Z0-9]{5,80}', str(product.get('id', ''))):
                    raise SafeError('PayPal no confirmo el identificador del producto sandbox.')
                state['product_id'] = product['id']
                save_state(path, state)
            plan = request('/v1/billing/plans', auth, plan_body(state['product_id']), state['request_id'] + 'b')
            if not re.fullmatch(r'P-[A-Z0-9]{10,40}', str(plan.get('id', ''))):
                raise SafeError('PayPal no confirmo el identificador del plan sandbox.')
            state['plan_id'] = plan['id']
            save_state(path, state)
        fresh = request('/v1/billing/plans/' + state['plan_id'], auth)
        validate_plan(fresh)
        if fresh.get('product_id') != state['product_id']:
            raise SafeError('El producto del plan sandbox no coincide con el estado conservado.')
        return {'product_id': state['product_id'], 'plan_id': state['plan_id']}


def main(argv=None):
    parser = argparse.ArgumentParser(description='Verificar PayPal sandbox usando los dos secretos ya guardados, sin imprimir claves.')
    parser.add_argument('--create-plan', action='store_true', help='Crear producto y plan sandbox de USD 20; no crea suscripciones ni cobros.')
    args = parser.parse_args(argv)
    try:
        if os.environ.get('PAYPAL_MODE', 'off') not in ('off', 'sandbox'):
            raise SafeError('Ejecutar solo fuera de una configuracion PayPal live.')
        client_id, client_secret = (secret(name) for name in SECRETS)
        auth = authorization(client_id, client_secret)
        request('/v1/billing/plans?page_size=1', auth)
        result = {'mode': 'sandbox', 'credentialsVerified': True, 'subscriptionsApiVerified': True, 'chargesCreated': 0}
        if args.create_plan:
            result.update(create_plan(auth, hashlib.sha256(client_id.encode()).hexdigest()))
        print(json.dumps(result, indent=2))
        return 0
    except SafeError as error:
        print(str(error), file=sys.stderr)
    except Exception:
        print('La comprobacion se detuvo. No se muestran detalles privados; conserva el estado para revisar.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
