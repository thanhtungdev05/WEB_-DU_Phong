import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "app.js").read_text(encoding="utf-8")


class TrackingOutboxContractTests(unittest.TestCase):
    def test_outbox_queues_on_transient_failures_in_both_paths(self):
        # Auth pre-check (hit first when the DB is down) and the POST itself.
        self.assertGreaterEqual(APP_JS.count("enqueueTrackingResult("), 3)
        self.assertIn("isTransientTrackingError(error)", APP_JS)
        self.assertIn("isTransientTrackingError(err)", APP_JS)

    def test_outbox_is_idempotent_and_bounded(self):
        self.assertIn("TRACKING_OUTBOX_TTL_MS", APP_JS)
        self.assertIn("TRACKING_OUTBOX_MAX_ITEMS", APP_JS)
        self.assertIn("item.payload.submission_id !== payload.submission_id", APP_JS)

    def test_outbox_scoped_to_current_user_and_cleared_on_success(self):
        self.assertIn("String(item.payload.technician_id) === String(_currentUser.technician_id)", APP_JS)
        self.assertIn("removeTrackingOutboxItem(payload.submission_id)", APP_JS)

    def test_outbox_never_retries_permanent_rejections_forever(self):
        flush = APP_JS[APP_JS.index("function flushTrackingOutbox"):]
        flush = flush[:flush.index("window.addEventListener('online'")]
        self.assertIn("res.status === 401", flush)
        self.assertIsNotNone(re.search(r"res\.status >= 500", flush))
        self.assertIn("removeTrackingOutboxItem(item.payload.submission_id)", flush)

    def test_server_accepts_resubmission_by_submission_id(self):
        handler = (ROOT / "api" / "lib" / "tracking_handler.php").read_text(encoding="utf-8")
        self.assertIn("WHERE submission_id = :submission_id", handler)
        self.assertIn("tracking/submission-conflict", handler)


if __name__ == "__main__":
    unittest.main()
