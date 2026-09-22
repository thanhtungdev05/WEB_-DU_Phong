import os
import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ADMIN_APP_ROOT = PROJECT_ROOT / 'admin_app'
if str(ADMIN_APP_ROOT) not in sys.path:
    sys.path.insert(0, str(ADMIN_APP_ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'admin_site.settings')

import django

django.setup()

from django.utils import timezone

from admin_portal.models import (
    DeviceCatalog,
    FtcUser,
    LabCatalog,
    Region,
    Role,
    TimerSession,
)


class AdminModelTimestampTests(unittest.TestCase):
    timestamp_models = (DeviceCatalog, LabCatalog, Role, FtcUser, Region)

    def test_created_and_updated_fields_match_database_constraints(self):
        for model in self.timestamp_models:
            with self.subTest(model=model.__name__, field='created_at'):
                created_field = model._meta.get_field('created_at')
                self.assertFalse(created_field.null)
                self.assertTrue(created_field.auto_now_add)

            with self.subTest(model=model.__name__, field='updated_at'):
                updated_field = model._meta.get_field('updated_at')
                self.assertFalse(updated_field.null)
                self.assertTrue(updated_field.auto_now)

        session_created_field = TimerSession._meta.get_field('created_at')
        self.assertFalse(session_created_field.null)
        self.assertTrue(session_created_field.auto_now_add)

    def test_new_user_gets_timestamps_before_insert(self):
        user = FtcUser(
            email='timestamp-regression@example.com',
            display_name='Timestamp Regression',
            role_id='ADMIN',
        )

        created_at = FtcUser._meta.get_field('created_at').pre_save(user, add=True)
        updated_at = FtcUser._meta.get_field('updated_at').pre_save(user, add=True)

        self.assertIsNotNone(created_at)
        self.assertIsNotNone(updated_at)
        self.assertTrue(timezone.is_aware(created_at))
        self.assertTrue(timezone.is_aware(updated_at))
        self.assertEqual(user.created_at, created_at)
        self.assertEqual(user.updated_at, updated_at)


if __name__ == '__main__':
    unittest.main()
