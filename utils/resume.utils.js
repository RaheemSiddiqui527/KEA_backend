import fs from "fs";
import { PDFParse } from "pdf-parse";

const SKILLS_LIST = [
  "JavaScript", "Python", "Java", "C++", "HTML", "CSS", "React", "Node.js", 
  "Express", "MongoDB", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS", 
  "Azure", "GCP", "Git", "GitHub", "Problem Solving", "Teamwork", 
  "Communication", "Leadership", "Project Management", "Agile", "Scrum",
  "Tailwind", "Bootstrap", "Next.js", "Vue.js", "Angular", "TypeScript",
  "PHP", "Laravel", "Django", "Flask", "Spring Boot", "Machine Learning",
  "Deep Learning", "Data Analysis", "MySQL", "Redis", "Firebase"
];

/**
 * Extracts skills from a resume text using a predefined list of skills.
 * @param {string} text - The raw text from the resume.
 * @returns {string[]} - Array of matched skills.
 */
const extractSkillsFromText = (text) => {
  if (!text) return [];
  
  const matchedSkills = [];
  const lowerText = text.toLowerCase();

  SKILLS_LIST.forEach(skill => {
    // Escape special characters for regex (like C++)
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check for exact word match with boundary handling
    // We use a custom boundary check to handle skills with special characters at the end (like C++)
    const regex = new RegExp(`(^|\\s|[,./;])(${escapedSkill})($|\\s|[,./;])`, 'i');
    
    if (regex.test(lowerText)) {
      matchedSkills.push(skill);
    }
  });

  return matchedSkills;
};

/**
 * Parses a PDF file and extracts text.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} - Extracted text.
 */
export const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return "";
  }
};

/**
 * Automatically fetch skills from a resume file.
 * @param {string} filePath - Path to the resume file.
 * @returns {Promise<string[]>} - List of extracted skills.
 */
export const autoFetchSkills = async (filePath) => {
  console.log("🔍 Starting skill extraction for:", filePath);
  const text = await extractTextFromPdf(filePath);
  if (!text) {
    console.log("❌ No text extracted from PDF");
    return [];
  }
  console.log("📄 Extracted text (first 100 chars):", text.substring(0, 100));
  const skills = extractSkillsFromText(text);
  console.log("✅ Matched skills:", skills);
  return skills;
};
