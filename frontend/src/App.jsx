import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import "./App.css";

const App = () => {
    const jobRoles = [
        "Software Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Data Scientist",
        "Machine Learning Engineer",
        "AI Engineer",
        "Product Manager",
        "UX/UI Designer",
        "DevOps Engineer",
        "Mobile App Developer",
        "Cloud Engineer",
        "Cybersecurity Analyst",
        "Business Analyst",
        "Custom"
    ];

    const [activeTab, setActiveTab] = useState("upload");
    const [selectedJobRole, setSelectedJobRole] = useState("");
    const [customJobRole, setCustomJobRole] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState("");

    const finalJobRole =
        selectedJobRole === "Custom" ? customJobRole : selectedJobRole;
    const isAnalyzeDisabled = !finalJobRole.trim() || !resumeFile;

    const handleFileChange = (e) => {
        setResumeFile(e.target.files[0]);
    };

    const analyzeResume = async () => {
        if (!resumeFile) {
            alert("Please upload a resume first!");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResult("");

        try {
            const formData = new FormData();
            formData.append("resume", resumeFile);
            formData.append("job_role", finalJobRole);
            formData.append("job_description", jobDescription);

            const res = await fetch("https://airesume-reviewer.onrender.com/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to analyze resume");

            const data = await res.json();
            setAnalysisResult(data.analysis || data.error || "No analysis returned.");
        } catch (err) {
            alert(err.message || "Error analyzing resume.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // —————— Helper Predicates ——————
    const headers = ['Experience', 'Weaknesses', 'Suggestions', 'Recommendations'];
    const headerRegex = new RegExp(`^(${headers.join('|')})`, 'i');

    function isSectionHeader(line) {
        return headerRegex.exec(line.trim());
    }

    function isBullet(line) {
        const t = line.trim();
        return t.startsWith('•') || t.startsWith('-') || /^\d+\./.exec(t);
    }

    // —————— Helper Draw Functions ——————
    /**
     * Draws text wrapped at roughly maxCharsPerLine.
     * Updates and returns newY.
     */
    function wrapAndDraw(page, text, x, y, font, size, maxCharsPerLine) {
        const words = text.split(' ');
        let buffer = '';

        for (const word of words) {
            if ((buffer + word).length > maxCharsPerLine) {
                page.drawText(buffer.trim(), { x, y, size, font, color: rgb(0, 0, 0) });
                y -= size * 1.4;
                buffer = word + ' ';
            } else {
                buffer += word + ' ';
            }
        }

        if (buffer.trim()) {
            page.drawText(buffer.trim(), { x, y, size, font, color: rgb(0, 0, 0) });
            y -= size * 1.4;
        }

        return y;
    }

    // —————— Main Download Function ——————
   async function downloadReport() {
  if (!analysisResult) {
    alert("No report available to download.");
    return;
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;

    drawHeader(page, font, y);
    y -= 80;

    y = drawBody(page, font, y, analysisResult);

    drawFooter(page, font, y);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const filename = `${finalJobRole?.replace(/[^a-z0-9]/gi, "_") || "resume-analysis"}.pdf`;
    triggerPDFDownload(blob, filename);
  } catch (err) {
    console.error("Download failed:", err);
  }
}

function drawHeader(page, font, y) {
  page.drawText("AI Resume Analysis Report", {
    x: 50,
    y,
    size: 18,
    font,
    color: rgb(0, 0.4, 0.7),
  });
  y -= 30;

  page.drawText(`Job Role: ${finalJobRole}`, { x: 50, y, size: 12, font });
  y -= 20;

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y, size: 12, font });
}

function drawBody(page, font, y, content) {
  const lines = content.split("\n");

  for (const raw of lines) {
    if (y < 60) {
      page.drawText("⚠️ Content truncated due to page limit.", {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(1, 0, 0),
      });
      break;
    }

    if (isSectionHeader(raw)) {
      page.drawText(raw.replace(":", "").trim(), {
        x: 50,
        y,
        size: 14,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 24;
    } else if (isBullet(raw)) {
      page.drawText(raw.trim(), {
        x: 65,
        y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 18;
    } else if (raw.trim()) {
      y = wrapAndDraw(page, raw.trim(), 50, y, font, 11, 90);
    } else {
      y -= 12;
    }
  }

  return y;
}

function drawFooter(page, font, y) {
  y -= 20;
  page.drawText("Powered by AI Resume Reviewer", {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
}

function triggerPDFDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

    return (
        <div className="app-container">
            <div className="card">
                {/* Header */}
                <div className="header">
                    <span className="icon" aria-hidden="true">📄</span>
                    <h1 className="title">AI Resume Reviewer</h1>
                    <span className="badge">⚡ Powered by AI</span>
                    <p className="subtitle">
                        Upload your resume and get a smart, AI-powered analysis tailored for your dream job.
                    </p>
                </div>

                {/* Tabs */}
                <div className="tab-group">
                    <button
                        className={activeTab === "upload" ? "active" : ""}
                        onClick={() => setActiveTab("upload")}
                    >
                        Upload File
                    </button>
                    <button
                        className={activeTab === "paste" ? "active" : ""}
                        onClick={() => setActiveTab("paste")}
                    >
                        Paste Text
                    </button>
                </div>

                {/* Upload Tab */}
                {activeTab === "upload" && (
                    <div className="upload-section">
                        <label htmlFor="resume-upload" className="upload-box">
                            <span className="upload-title">📄 Upload Resume</span>
                            <input
                                id="resume-upload"
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                className="file-input-hidden"
                                onChange={handleFileChange}
                            />
                            <p className="upload-text">
                                {resumeFile ? (
                                    <>✅ <strong>{resumeFile.name}</strong> uploaded</>
                                ) : (
                                    <>Click to upload or drag and drop your resume.<br />Supports PDF, DOC, DOCX, TXT files.</>
                                )}
                            </p>
                        </label>
                    </div>
                )}

                {/* Paste Tab */}
                {activeTab === "paste" && (
                    <textarea
                        className="paste-textarea"
                        placeholder="Paste your resume text here..."
                    />
                )}

                {/* Optional Fields */}
                <div className="optional-fields">
                    <select
                        className="select"
                        value={selectedJobRole}
                        onChange={(e) => setSelectedJobRole(e.target.value)}
                    >
                        <option value="">Job Role (Optional)</option>
                        {jobRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>

                    {selectedJobRole === "Custom" && (
                        <input
                            type="text"
                            placeholder="Enter custom job role"
                            className="input"
                            value={customJobRole}
                            onChange={(e) => setCustomJobRole(e.target.value)}
                        />
                    )}

                    <textarea
                        placeholder="Job Description (Optional)"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>

                {/* Action Buttons */}
                <div className="button-group">
                    <button
                        onClick={analyzeResume}
                        disabled={isAnalyzeDisabled || isAnalyzing}
                        className={`btn analyze-btn ${isAnalyzeDisabled || isAnalyzing ? "disabled" : ""}`}
                    >
                        {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Resume"}
                    </button>

                    <button
                        onClick={downloadReport}
                        className={`btn download-btn ${!analysisResult ? "disabled" : ""}`}
                        disabled={!analysisResult}
                    >
                        📥 Download Report
                    </button>
                </div>

                {/* Analysis Section */}
                <div className="section analysis-section">
                    <h3 className="analysis-title">📊 Analysis Report</h3>
                    <div className="analysis-box">
                        {analysisResult ? (
                            <ReactMarkdown>{analysisResult}</ReactMarkdown>
                        ) : (
                            <p className="placeholder">
                                Your analysis will appear here once you upload a resume and click{" "}
                                <strong>Analyze Resume</strong>.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
