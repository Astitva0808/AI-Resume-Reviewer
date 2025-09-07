from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import google.generativeai as genai
from google.oauth2 import service_account

# ✅ Load Gemini credentials from your downloaded JSON key file
creds = service_account.Credentials.from_service_account_file("key.json")
genai.configure(credentials=creds)

# ✅ Initialize Gemini model
model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["https://ai-resume-reviewer-4ahb.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Resume Reviewer Backend Running (Gemini Pro)"}

@app.post("/api/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_role: str = Form(...)
):
    try:
        # Extract text from PDF
        text = ""
        try:
            pdf_reader = PyPDF2.PdfReader(resume.file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
        except Exception as e:
            print("PDF parsing failed:", e)

        if not text.strip():
            return {
                "analysis": "❌ Could not extract text from the PDF. Please upload a typed resume with selectable text."
            }

        # Build prompt
        prompt = (
            f"You are an expert career advisor and resume reviewer. Carefully analyze the following resume for the role of '{job_role}'. "
            f"Your evaluation should include:\n\n"
            f"1. A score out of 100 based on relevance, clarity, and impact.\n"
            f"3. do not score way too strictly nor way too easily.Scores should change a\n"
            f"2. Key strengths — highlight what stands out and why.\n"
            f"4. Weaknesses — identify gaps, vague areas, or missing elements. Each weakness should have a short description.\n"
            f"5. Suggestions to improve weaknesses — be specific and actionable.make description short , crisp and to the point.\n"
            f"6. Recommendations to help this candidate land a better position — include certifications, skills to learn, projects to build, or networking strategies.\n"
            f"7. Tone — be honest but encouraging, as if mentoring someone who genuinely wants to grow. Throughout the evaluation keep a soft tone so that customer don't feel discouraged at all.\n\n"
            f"Resume:\n{text}"
        )

        # Send to Gemini Pro
        response = model.generate_content(prompt)
        result = response.text

        if not result.strip():
            return {"analysis": "⚠️ Gemini returned no content. Try uploading a more detailed resume."}

        return {"analysis": result}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"🚨 Server error: {str(e)}"}
