import os
import sys
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ADMIN_APP_ROOT = PROJECT_ROOT / 'admin_app'
if str(ADMIN_APP_ROOT) not in sys.path:
    sys.path.insert(0, str(ADMIN_APP_ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'admin_site.settings')

import django

django.setup()

from admin_portal.admin import FtcUserAdmin
from admin_portal.models import FtcUser
from django.contrib import admin, messages


class AdminUserEditActionTests(unittest.TestCase):
    def setUp(self):
        self.model_admin = FtcUserAdmin(FtcUser, admin.site)
        self.user = FtcUser(
            user_id=uuid.uuid4(),
            email='missing-name@example.com',
            display_name=None,
            role_id='KTV',
        )
        self.model_admin.message_user = Mock()

    def test_email_is_an_edit_link_when_display_name_is_empty(self):
        self.assertEqual(self.model_admin.list_display_links, ['display_name', 'email'])
        self.assertNotIn('display_name', self.model_admin.readonly_fields)

    def test_action_redirects_exactly_one_authorized_user_to_change_form(self):
        request = SimpleNamespace(user=SimpleNamespace(has_perm=lambda *args: True))

        response = self.model_admin.edit_selected_user(request, [self.user])

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            f'/admin/admin_portal/ftcuser/{self.user.pk}/change/',
        )

    def test_action_rejects_multiple_users(self):
        request = SimpleNamespace(user=SimpleNamespace(has_perm=lambda *args: True))

        response = self.model_admin.edit_selected_user(request, [self.user, FtcUser(user_id=uuid.uuid4())])

        self.assertIsNone(response)
        self.model_admin.message_user.assert_called_once()
        self.assertEqual(self.model_admin.message_user.call_args.kwargs['level'], messages.WARNING)

    def test_action_rechecks_change_permission_server_side(self):
        request = SimpleNamespace(user=SimpleNamespace(has_perm=lambda *args: False))

        response = self.model_admin.edit_selected_user(request, [self.user])

        self.assertIsNone(response)
        self.model_admin.message_user.assert_called_once()
        self.assertEqual(self.model_admin.message_user.call_args.kwargs['level'], messages.ERROR)


if __name__ == '__main__':
    unittest.main()
