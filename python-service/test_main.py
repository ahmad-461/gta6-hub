import unittest
import os
from fastapi.testclient import TestClient
import main
import config

class TestAnalysisService(unittest.TestCase):
    def setUp(self):
        # Use TestClient to invoke endpoints without running a live server
        self.client = TestClient(main.app)
        config.INTERNAL_SERVICE_SECRET = "test-secret-key-123"

    def test_unauthorized_request(self):
        # No header
        response = self.client.get("/api/content-stats")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_request(self):
        # Wrong key
        response = self.client.get("/api/content-stats", headers={"X-Internal-Key": "wrong-key"})
        self.assertEqual(response.status_code, 403)

    def test_authorized_content_stats(self):
        # Correct key
        response = self.client.get("/api/content-stats", headers={"X-Internal-Key": "test-secret-key-123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("average_word_count", data)
        self.assertIn("readability_score", data)
        self.assertIn("word_count_trend", data)

    def test_authorized_seo_audit(self):
        # Correct key
        response = self.client.get("/api/seo-audit", headers={"X-Internal-Key": "test-secret-key-123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_authorized_topic_coverage(self):
        # Correct key
        response = self.client.get("/api/topic-coverage", headers={"X-Internal-Key": "test-secret-key-123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("well_covered", data)
        self.assertIn("under_covered", data)

    def test_authorized_sentiment_trend(self):
        # Correct key
        response = self.client.get("/api/sentiment-trend", headers={"X-Internal-Key": "test-secret-key-123"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Verify it has weekly keys containing positive/neutral/negative metrics
        self.assertGreater(len(data), 0)
        first_key = list(data.keys())[0]
        self.assertIn("positive", data[first_key])
        self.assertIn("neutral", data[first_key])
        self.assertIn("negative", data[first_key])

    def test_production_missing_supabase_credentials(self):
        # When ENVIRONMENT is "production" and supabase client is not initialized,
        # it should raise a 500 error instead of using mock fallback.
        os.environ["ENVIRONMENT"] = "production"
        orig_supabase = main.supabase_client
        main.supabase_client = None
        try:
            response = self.client.get("/api/content-stats", headers={"X-Internal-Key": "test-secret-key-123"})
            self.assertEqual(response.status_code, 500)
            self.assertIn("credentials are required", response.json()["detail"])
        finally:
            main.supabase_client = orig_supabase
            os.environ.pop("ENVIRONMENT", None)

if __name__ == "__main__":
    unittest.main()
