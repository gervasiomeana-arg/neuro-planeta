#!/usr/bin/env python3
"""Cloud Shell: authenticate to PayPal Live and read plans only. No billing writes."""
import base64
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request

PROJECT = 'gen-lang-client-0958943545'
HOST = 'https://api-m.paypal.com'
SECRETS = ('neuroplaneta-paypal-live-client-id', 'neuroplaneta-paypal-live-client-secret')


class SafeError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def secret(name):
    if name not in SECRETS:
        raise SafeError('Secreto no permitido.')
    try:
        result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest',
                                 '--secret=' + name, '--project=' + PROJECT, '--quiet'],
                                capture_output=True, text=True, check=True, timeout=45)
        value = result.stdout.strip()
        if not re.fullmatch(r'[A-Za-z0-9_-]{20,512}', value):
            raise SafeError('Formato no valido en ' + name + '. Copia solo el valor de NeuroPlaneta Live.')
        return value
    except (subprocess.SubprocessError, OSError):
        raise SafeError('No se pudo leer ' + name + '. Revisa la autorizacion de Cloud Shell.') from None


def request(path, authorization):
    if path not in ('/v1/oauth2/token', '/v1/billing/plans?page_size=1'):
        raise SafeError('Ruta no permitida: esta herramienta solo autentica y consulta planes.')
    oauth = path == '/v1/oauth2/token'
    req = urllib.request.Request(HOST + path,
                                 data=b'grant_type=client_credentials' if oauth else None,
                                 method='POST' if oauth else 'GET',
                                 headers={'Authorization': authorization,
                                          'Content-Type': 'application/x-www-form-urlencoded' if oauth else 'application/json'})
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=25) as response:
            result = json.loads(response.read(2_000_001))
        if not isinstance(result, dict):
            raise ValueError()
        return result
    except urllib.error.HTTPError as error:
        if error.code == 401:
            raise SafeError('PayPal rechazo las credenciales Live. Revisa que ambos valores sean de NeuroPlaneta Live.') from None
        if error.code == 403:
            raise SafeError('PayPal no autoriza la consulta Live. Revisa Subscriptions y la elegibilidad de la cuenta.') from None
        raise SafeError('PayPal no confirmo la consulta Live (HTTP ' + str(error.code) + ').') from None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        raise SafeError('No se pudo verificar la respuesta de PayPal Live. No se activaron cobros.') from None


def main(argv=None):
    if argv:
        print('Esta herramienta no acepta opciones ni operaciones de escritura.', file=sys.stderr)
        return 1
    try:
        client_id, client_secret = (secret(name) for name in SECRETS)
        basic = base64.b64encode((client_id + ':' + client_secret).encode()).decode()
        token = request('/v1/oauth2/token', 'Basic ' + basic)
        access = token.get('access_token')
        if not isinstance(access, str) or not access or str(token.get('token_type', '')).lower() != 'bearer':
            raise SafeError('PayPal no devolvio una autorizacion Live valida.')
        plans = request('/v1/billing/plans?page_size=1', 'Bearer ' + access)
        if not isinstance(plans.get('plans'), list):
            raise SafeError('PayPal no confirmo el listado de planes Live.')
        print(json.dumps({'mode': 'live', 'credentialsVerified': True,
                          'subscriptionsApiReadVerified': True, 'billingActivated': False,
                          'subscriptionsCreated': 0, 'chargesCreated': 0}, indent=2))
        return 0
    except SafeError as error:
        print(str(error), file=sys.stderr)
    except Exception:
        print('La comprobacion se detuvo sin mostrar datos privados. No se activaron cobros.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
