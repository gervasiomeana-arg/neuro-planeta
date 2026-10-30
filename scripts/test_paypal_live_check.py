import base64
import contextlib
import io
import json
import subprocess
import unittest
from unittest.mock import patch
import urllib.error
import paypal_live_check as live

CLIENT = 'fictional-live-client-only-2026'
SECRET = 'fictional-live-secret-only-2026'
TOKEN = 'fictional-private-oauth-token'


class LiveReadTests(unittest.TestCase):
    def test_only_named_live_secrets_and_two_fixed_requests_no_private_output(self):
        captured = []
        def cloud(args, **kwargs):
            self.assertEqual(args[:5], ['gcloud', 'secrets', 'versions', 'access', 'latest'])
            self.assertIn('--project=' + live.PROJECT, args)
            self.assertIn(args[5], ['--secret=' + name for name in live.SECRETS])
            self.assertTrue(kwargs['capture_output'])
            return subprocess.CompletedProcess(args, 0, CLIENT if args[5].endswith('client-id') else SECRET)
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, *args):
                return json.dumps({'access_token': TOKEN, 'token_type': 'Bearer'} if len(captured) == 1 else {'plans': [{'private': 'must-not-print'}]}).encode()
        def transport(req, **kwargs):
            captured.append(req)
            self.assertEqual(kwargs['timeout'], 25)
            return Response()
        output = io.StringIO()
        with patch.object(live.subprocess, 'run', side_effect=cloud), patch.object(live.urllib.request.OpenerDirector, 'open', side_effect=transport), contextlib.redirect_stdout(output):
            self.assertEqual(live.main([]), 0)
        self.assertEqual([(r.full_url, r.method) for r in captured], [(live.HOST + '/v1/oauth2/token', 'POST'), (live.HOST + '/v1/billing/plans?page_size=1', 'GET')])
        self.assertEqual(captured[0].data, b'grant_type=client_credentials')
        self.assertIsNone(captured[1].data)
        for value in (CLIENT, SECRET, TOKEN, 'must-not-print', base64.b64encode((CLIENT + ':' + SECRET).encode()).decode()):
            self.assertNotIn(value, output.getvalue())
        self.assertFalse(json.loads(output.getvalue())['billingActivated'])

    def test_mutations_alternate_hosts_and_options_are_rejected_before_network(self):
        with patch.object(live.urllib.request.OpenerDirector, 'open') as network:
            for path in ['/v1/billing/plans', '/v1/billing/subscriptions', '/v1/notifications/webhooks', 'https://evil.invalid']:
                with self.assertRaises(live.SafeError): live.request(path, SECRET)
            network.assert_not_called()
        with patch.object(live, 'secret') as read, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(live.main(['--create-plan']), 1)
            read.assert_not_called()
        self.assertIsNone(live.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil.invalid'))
        with self.assertRaises(live.SafeError): live.secret('sandbox-or-unrelated-secret')

    def test_provider_errors_bad_payloads_and_cloud_failures_never_echo_credentials(self):
        for failure in [urllib.error.HTTPError(live.HOST, status, SECRET, {}, None) for status in (401, 403, 500)]:
            with patch.object(live.urllib.request.OpenerDirector, 'open', side_effect=failure):
                with self.assertRaises(live.SafeError) as e: live.request('/v1/oauth2/token', SECRET)
                self.assertNotIn(SECRET, str(e.exception))
        with patch.object(live.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'gcloud', output=SECRET, stderr=TOKEN)):
            with self.assertRaises(live.SafeError) as e: live.secret(live.SECRETS[0])
            self.assertNotIn(SECRET, str(e.exception)); self.assertNotIn(TOKEN, str(e.exception))
        for payload in [{'access_token': TOKEN, 'token_type': 'wrong'}, {'access_token': None}]:
            out = io.StringIO()
            with patch.object(live, 'secret', return_value=CLIENT), patch.object(live, 'request', return_value=payload), contextlib.redirect_stderr(out):
                self.assertEqual(live.main([]), 1)
            self.assertNotIn(TOKEN, out.getvalue())


if __name__ == '__main__': unittest.main()
