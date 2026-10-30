import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch
import urllib.error

import paypal_sandbox as sandbox

CLIENT = 'fictional-client-id-only-2026'
SECRET = 'fictional-secret-value-only-2026'
PRODUCT = 'PROD-FICTIONAL000001'
PLAN = 'P-FICTIONAL00000001'


def valid_plan():
    return {**sandbox.plan_body(PRODUCT), 'id': PLAN}


class SandboxTests(unittest.TestCase):
    def test_check_reads_only_named_secrets_and_never_prints_credentials(self):
        def cloud(args, **kwargs):
            self.assertEqual(args[:5], ['gcloud', 'secrets', 'versions', 'access', 'latest'])
            self.assertIn('--project=' + sandbox.PROJECT, args)
            self.assertTrue(kwargs['capture_output'])
            return subprocess.CompletedProcess(args, 0, CLIENT if args[5].endswith('client-id') else SECRET)

        def paypal(path, auth, *args):
            self.assertTrue(sandbox.HOST.endswith('sandbox.paypal.com'))
            if path == '/v1/oauth2/token':
                return {'access_token': 'fictional-private-token', 'token_type': 'Bearer'}
            self.assertEqual(path, '/v1/billing/plans?page_size=1')
            return {'plans': [{'private': 'must-not-print'}]}

        output = io.StringIO()
        with patch.object(sandbox.subprocess, 'run', side_effect=cloud), patch.object(sandbox, 'request', side_effect=paypal) as request, patch.dict(sandbox.os.environ, {'PAYPAL_MODE': 'off'}), contextlib.redirect_stdout(output):
            self.assertEqual(sandbox.main([]), 0)
            self.assertEqual(request.call_count, 2)
        result = json.loads(output.getvalue())
        self.assertTrue(result['credentialsVerified'])
        self.assertEqual(result['chargesCreated'], 0)
        for value in (CLIENT, SECRET, 'fictional-private-token', 'must-not-print'):
            self.assertNotIn(value, output.getvalue())

    def test_cloud_errors_do_not_echo_secret_or_provider_output(self):
        with patch.object(sandbox.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'gcloud', output=SECRET, stderr='private-provider-info')):
            with self.assertRaises(sandbox.SafeError) as error:
                sandbox.secret(sandbox.SECRETS[1])
        self.assertNotIn(SECRET, str(error.exception))
        self.assertNotIn('private-provider-info', str(error.exception))

    def test_live_environment_stops_before_reading_credentials(self):
        output = io.StringIO()
        with patch.dict(sandbox.os.environ, {'PAYPAL_MODE': 'live'}), patch.object(sandbox, 'secret') as read, contextlib.redirect_stderr(output):
            self.assertEqual(sandbox.main([]), 1)
            read.assert_not_called()

    def test_request_rejects_other_paths_and_redacts_paypal_errors(self):
        with self.assertRaises(sandbox.SafeError):
            sandbox.request('https://attacker.example.invalid', SECRET)
        failure = urllib.error.HTTPError(sandbox.HOST, 401, SECRET, {}, None)
        with patch.object(sandbox.urllib.request.OpenerDirector, 'open', side_effect=failure):
            with self.assertRaises(sandbox.SafeError) as error:
                sandbox.request('/v1/oauth2/token', SECRET)
        self.assertNotIn(SECRET, str(error.exception))
        self.assertIsNone(sandbox.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://example.invalid'))

    def test_created_plan_is_reused_without_posting_again_or_storing_keys(self):
        def paypal(path, auth, body=None, request_id=None):
            self.assertEqual(auth, 'Bearer fictional-token')
            if path == '/v1/catalogs/products':
                return {'id': PRODUCT}
            if path == '/v1/billing/plans':
                return valid_plan()
            self.assertEqual(path, '/v1/billing/plans/' + PLAN)
            return valid_plan()

        with tempfile.TemporaryDirectory() as home, patch.object(sandbox.Path, 'home', return_value=Path(home)), patch.object(sandbox, 'request', side_effect=paypal) as request:
            self.assertEqual(sandbox.create_plan('Bearer fictional-token', 'fictional-fingerprint')['plan_id'], PLAN)
            posts = [call for call in request.call_args_list if len(call.args) > 2]
            self.assertEqual(len(posts), 2)
            request.reset_mock()
            sandbox.create_plan('Bearer fictional-token', 'fictional-fingerprint')
            self.assertEqual(request.call_count, 1)
            state = (Path(home) / '.local/state/neuroplaneta-paypal-sandbox/plan.json').read_text()
            self.assertNotIn('Bearer fictional-token', state)
            self.assertNotIn(SECRET, state)
            self.assertEqual((Path(home) / '.local/state/neuroplaneta-paypal-sandbox/plan.json').stat().st_mode & 0o777, 0o600)

    def test_interrupted_setup_keeps_same_request_id_and_product(self):
        ids = []
        fail = True

        def paypal(path, auth, body=None, request_id=None):
            nonlocal fail
            if path == '/v1/catalogs/products':
                return {'id': PRODUCT}
            if path == '/v1/billing/plans':
                ids.append(request_id)
                if fail:
                    fail = False
                    raise sandbox.SafeError('Fictional network interruption')
                return valid_plan()
            return valid_plan()

        with tempfile.TemporaryDirectory() as home, patch.object(sandbox.Path, 'home', return_value=Path(home)), patch.object(sandbox, 'request', side_effect=paypal) as request:
            with self.assertRaises(sandbox.SafeError):
                sandbox.create_plan('fictional', 'fingerprint')
            sandbox.create_plan('fictional', 'fingerprint')
            self.assertEqual(ids[0], ids[1])
            self.assertEqual(sum(call.args[0] == '/v1/catalogs/products' for call in request.call_args_list), 1)

    def test_expired_or_different_app_state_never_creates_another_plan(self):
        with tempfile.TemporaryDirectory() as home, patch.object(sandbox.Path, 'home', return_value=Path(home)), patch.object(sandbox, 'request') as request:
            directory = Path(home) / '.local/state/neuroplaneta-paypal-sandbox'
            directory.mkdir(parents=True)
            sandbox.save_state(directory / 'plan.json', {'fingerprint': 'old-app', 'request_id': 'fictional', 'created_at': time.time() - 73 * 3600})
            with self.assertRaises(sandbox.SafeError):
                sandbox.create_plan('fictional', 'new-app')
            with self.assertRaises(sandbox.SafeError):
                sandbox.create_plan('fictional', 'old-app')
            request.assert_not_called()

    def test_non_matching_prices_cycles_or_extra_charges_are_rejected(self):
        sandbox.validate_plan(valid_plan())
        for mutate in [lambda p: p['billing_cycles'][0]['pricing_scheme']['fixed_price'].update(value='21.00'),
                       lambda p: p['billing_cycles'].append(p['billing_cycles'][0]),
                       lambda p: p['payment_preferences'].update(auto_bill_outstanding=True),
                       lambda p: p.update(taxes={'percentage': '5'}),
                       lambda p: p.update(quantity_supported=True)]:
            plan = valid_plan()
            mutate(plan)
            with self.assertRaises(sandbox.SafeError):
                sandbox.validate_plan(plan)


if __name__ == '__main__':
    unittest.main()
