from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import google.generativeai as genai
from google.oauth2 import service_account

# ✅ Load Gemini credentials from your downloaded JSON key file
creds = service_account.Credentials.from_service_account_file("key.json")
genai.configure(credentials=creds)

# ✅ Initialize Gemini model
model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()

# Allow your deployed frontend to access the backend
origins = [
    "https://ai-resume-reviewer-4ahb.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Only allow your frontend
    allow_credentials=True,
    allow_methods=["*"],              # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"]               # Allow all headers
)


@app.get("/")
async def root():
    return {"message": "AI Resume Reviewer Backend Running (Gemini Pro)"}

@app.post("/api/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    # Read PDF content
    contents = await file.read()
    reader = PyPDF2.PdfReader(io.BytesIO(contents))
    resume_text = ""
    for page in reader.pages:
        resume_text += page.extract_text()

    # Send to Gemini
    prompt = f"Analyze this resume and provide strengths, weaknesses, and job fit:\n\n{resume_text}"
    response = model.generate_content(prompt)

    return {"analysis": response.text}

        # Build prompt
       prompt = (
    f"You are an expert career advisor and resume reviewer. Carefully analyze the following resume for the role of '{job_role}'.\n\n"
    f"Your evaluation should include:\n"
    f"1. A score out of 100 based on relevance, clarity, and impact.\n"
    f"2. Key strengths — highlight what stands out and why.\n"
    f"3. Weaknesses — identify gaps, vague areas, or missing elements. Each weakness should have a short description.\n"
    f"4. Suggestions to improve weaknesses — be specific and actionable. Make descriptions short, crisp, and to the point.\n"
    f"5. Recommendations to help this candidate land a better position — include certifications, skills to learn, projects to build, or networking strategies.\n"
    f"6. Tone — be honest but encouraging, as if mentoring someone who genuinely wants to grow. Keep a soft tone so the candidate doesn't feel discouraged.\n\n"
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
