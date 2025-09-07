# test_upload.py
import requests
import os

# ---------------- Config ----------------
BACKEND_URL = "http://127.0.0.1:8000"
PDF_FILE_PATH = "D:/Codeworkspace/resume-sample.pdf"
TEXT_RESUME = """
John Doe
Email: john.doe@example.com
Experience: 3 years in software development
Skills: Python, JavaScript, FastAPI
Education: B.Tech in Computer Science
"""

# ---------------- PDF Upload Test ----------------
def test_pdf_upload(file_path):
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    try:
        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{BACKEND_URL}/upload-resume", files=files)

        print("PDF Upload Status code:", response.status_code)
        print("PDF Upload Response:", response.json())

    except requests.exceptions.RequestException as e:
        print(f"❌ PDF Upload Request Error: {e}")

# ---------------- Text Resume Upload Test ----------------
def test_text_upload(text):
    if not text.strip():
        print("❌ Text resume is empty.")
        return

    try:
        from requests_toolbelt.multipart.encoder import MultipartEncoder

        m = MultipartEncoder(fields={"resume_text": text})
        response = requests.post(
            f"{BACKEND_URL}/upload-text",
            data=m,
            headers={"Content-Type": m.content_type},
        )

        print("Text Upload Status code:", response.status_code)
        print("Text Upload Response:", response.json())

    except requests.exceptions.RequestException as e:
        print(f"❌ Text Upload Request Error: {e}")

# ---------------- Main ----------------
if __name__ == "__main__":
    print("=== Testing PDF Upload ===")
    test_pdf_upload(PDF_FILE_PATH)

    print("\n=== Testing Text Resume Upload ===")
    test_text_upload(TEXT_RESUME)
