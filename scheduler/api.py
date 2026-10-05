import httpx

from . import config


class ComplianceApi:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or config.API_BASE_URL).rstrip("/")

    def list_evaluable(self) -> list[dict]:
        response = httpx.get(
            f"{self.base_url}/compliance-records",
            params={"status": "active,expiring,renewed"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def evaluate(self, record_id: str, status: str, fingerprint: str) -> dict:
        response = httpx.post(
            f"{self.base_url}/compliance-records/{record_id}/evaluate",
            json={"status": status, "fingerprint": fingerprint},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
