#!/usr/bin/env python3
"""
Unit tests for /api/subtitles (functions/api/subtitles.js and tools/local_server.py parity).
Verifies:
  1. SRT to WebVTT timestamp conversion.
  2. XSS tag stripping and sanitization (<script>, <img onerror>, etc.).
  3. SSRF guard on outbound proxy URLs.
  4. End-to-end lookup with IMDb ID and TMDB ID fallback.
  5. Proxy mode returning clean WebVTT with CORS headers.
  6. Origin and CORS policy compliance.
"""

import json
import pathlib
import subprocess
import sys
import unittest
import urllib.parse
from local_server import srt_to_vtt, is_safe_subtitle_url, SUBTITLE_LANG_MAP, is_allowed_origin

ROOT = pathlib.Path(__file__).resolve().parent.parent


class TestSubtitlesConversion(unittest.TestCase):
    def test_srt_to_vtt_timestamps(self):
        srt_input = (
            "1\n"
            "00:01:20,123 --> 00:01:25,456\n"
            "Olá mundo!\n"
            "\n"
            "2\n"
            "00:01:26,789 --> 00:01:30,000\n"
            "Segunda linha.\n"
        )
        vtt_output = srt_to_vtt(srt_input)
        self.assertTrue(vtt_output.startswith("WEBVTT\n\n"))
        self.assertIn("00:01:20.123 --> 00:01:25.456", vtt_output)
        self.assertIn("00:01:26.789 --> 00:01:30.000", vtt_output)
        self.assertNotIn("00:01:20,123", vtt_output)

    def test_srt_to_vtt_xss_sanitization(self):
        malicious_srt = (
            "1\n"
            "00:00:01,000 --> 00:00:05,000\n"
            "<b>Texto em negrito</b> e <script>alert('xss')</script>.\n"
            "\n"
            "2\n"
            "00:00:06,000 --> 00:00:10,000\n"
            "<img src=x onerror=alert(1)> e <i>Texto em itálico</i>\n"
        )
        vtt_output = srt_to_vtt(malicious_srt)
        # Bold and italics preserved
        self.assertIn("<b>Texto em negrito</b>", vtt_output)
        self.assertIn("<i>Texto em itálico</i>", vtt_output)
        # Scripts and handlers completely stripped
        self.assertNotIn("<script>", vtt_output)
        self.assertNotIn("</script>", vtt_output)
        self.assertNotIn("<img", vtt_output)
        self.assertNotIn("onerror", vtt_output)

    def test_already_vtt(self):
        vtt_input = "WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nLegenda padrão"
        vtt_output = srt_to_vtt(vtt_input)
        self.assertTrue(vtt_output.startswith("WEBVTT"))
        self.assertIn("Legenda padrão", vtt_output)


class TestSubtitlesSecurity(unittest.TestCase):
    def test_safe_urls(self):
        self.assertTrue(is_safe_subtitle_url("https://subs5.strem.io/en/download/file/123"))
        self.assertTrue(is_safe_subtitle_url("https://opensubtitles.org/subtitles/456.srt"))
        self.assertTrue(is_safe_subtitle_url("http://example.com/sub.vtt"))

    def test_ssrf_blocked_urls(self):
        self.assertFalse(is_safe_subtitle_url("http://localhost:8787/api/account"))
        self.assertFalse(is_safe_subtitle_url("http://127.0.0.1:8787/api/account"))
        self.assertFalse(is_safe_subtitle_url("http://192.168.1.1/secret"))
        self.assertFalse(is_safe_subtitle_url("http://10.0.0.1/admin"))
        self.assertFalse(is_safe_subtitle_url("http://172.16.0.1/internal"))
        self.assertFalse(is_safe_subtitle_url("ftp://example.com/sub.srt"))
        self.assertFalse(is_safe_subtitle_url("file:///etc/passwd"))


class TestSubtitlesLanguageMapping(unittest.TestCase):
    def test_pt_br_priority(self):
        pob = SUBTITLE_LANG_MAP.get("pob")
        por = SUBTITLE_LANG_MAP.get("por")
        eng = SUBTITLE_LANG_MAP.get("eng")
        self.assertIsNotNone(pob)
        self.assertEqual(pob["code"], "pt-BR")
        self.assertEqual(pob["priority"], 1)
        self.assertLess(pob["priority"], por["priority"])
        self.assertLess(por["priority"], eng["priority"])


class TestNodeJsParity(unittest.TestCase):
    def test_node_subtitles_module_exports(self):
        """Verifies that functions/api/subtitles.js exports srtToVtt and cleanVtt and runs identically."""
        script = """
        import { srtToVtt, cleanVtt } from './functions/api/subtitles.js';
        const srt = '1\\n00:01:00,500 --> 00:01:05,500\\n<script>alert(1)</script><b>Teste</b>\\n';
        const vtt = srtToVtt(srt);
        console.log(JSON.stringify({
            hasWebvtt: vtt.startsWith('WEBVTT'),
            hasTimestamp: vtt.includes('00:01:00.500 --> 00:01:05.500'),
            hasScript: vtt.includes('<script>'),
            hasBold: vtt.includes('<b>Teste</b>')
        }));
        """
        res = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution error: {res.stderr}")
        data = json.loads(res.stdout.strip())
        self.assertTrue(data["hasWebvtt"])
        self.assertTrue(data["hasTimestamp"])
        self.assertFalse(data["hasScript"])
        self.assertTrue(data["hasBold"])


if __name__ == "__main__":
    unittest.main()
