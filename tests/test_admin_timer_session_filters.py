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

from django.db.models import Q

from admin_portal.admin import (
    GUIDE_MODE_VALUES,
    KNOWN_MODE_VALUES,
    PRACTICE_MODE_VALUES,
    build_session_mode_query,
    resolve_session_mode,
)


class TimerSessionModeFilterTests(unittest.TestCase):
    def test_filter_prefers_recognized_mode_over_conflicting_session_type(self):
        legacy_fallback = (
            Q(mode__isnull=True)
            | ~Q(mode__in=KNOWN_MODE_VALUES)
        )

        self.assertEqual(
            build_session_mode_query('practice'),
            Q(mode__in=PRACTICE_MODE_VALUES)
            | (legacy_fallback & Q(session_type='practice')),
        )
        self.assertEqual(
            build_session_mode_query('guide'),
            Q(mode__in=GUIDE_MODE_VALUES)
            | (legacy_fallback & Q(session_type='guide')),
        )

    def test_display_mode_uses_the_same_precedence_as_filter(self):
        self.assertEqual(resolve_session_mode('Hướng dẫn', 'practice'), 'guide')
        self.assertEqual(resolve_session_mode('Thực hành', 'guide'), 'practice')
        self.assertEqual(resolve_session_mode(None, 'guide'), 'guide')
        self.assertEqual(resolve_session_mode('legacy-value', 'practice'), 'practice')

    def test_unknown_filter_value_does_not_build_a_query(self):
        self.assertIsNone(build_session_mode_query(None))
        self.assertIsNone(build_session_mode_query('unexpected'))


if __name__ == '__main__':
    unittest.main()
