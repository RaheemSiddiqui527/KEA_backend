import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import ResourceCategory from '../models/resourceCategory.models.js';
import Discipline from '../models/discipline.models.js';

const initialCategories = [
  { name: 'AI/ML', subcategories: ['Deep Learning', 'NLP', 'Computer Vision', 'LLMs & Prompting'] },
  { name: 'Career guidance', subcategories: ['Resume Writing', 'Interview Prep', 'Higher Studies', 'Certifications'] },
  { name: 'Chemical', subcategories: ['Process Design', 'Plant Operations', 'Petrochemical', 'Thermodynamics'] },
  { name: 'Civil', subcategories: ['Structural', 'Geotechnical', 'Transportation', 'Water Resources'] },
  { name: 'Computer Science', subcategories: ['Algorithms', 'Data Structures', 'Operating Systems', 'Networking'] },
  { name: 'Data Science', subcategories: ['Data Analysis', 'Big Data', 'Data Visualization', 'Statistics'] },
  { name: 'Electrical', subcategories: ['Power Systems', 'Control Systems', 'Renewable Energy', 'High Voltage'] },
  { name: 'Electronics', subcategories: ['Embedded Systems', 'VLSI Design', 'IoT', 'Signal Processing'] },
  { 
    name: 'HSE – Health, Safety & Environment', 
    subcategories: [
      'Occupational Health', 'Workplace Health', 'Industrial Hygiene', 'Employee Wellbeing', 'Health Awareness',
      'Workplace Safety', 'Construction Safety', 'Industrial Safety', 'Fire Safety', 'Electrical Safety', 'Risk Assessment', 'Hazard Identification', 'PPE (Personal Protective Equipment)', 'Emergency Response', 'Safety Procedures',
      'Environmental Management', 'Sustainability', 'Waste Management', 'Pollution Control', 'Environmental Protection', 'Climate Awareness', 'ISO 14001', 'Environmental Compliance'
    ]
  },
  { name: 'IT', subcategories: ['Software Architecture', 'Guide', 'DevOps', 'Security', 'Cloud Computing', 'Web Development'] },
  { name: 'Mechanical', subcategories: ['HVAC Design', 'CAD & 3D Modeling', 'Thermal Engineering', 'Automotive', 'Manufacturing'] },
  { name: 'Project reports', subcategories: ['Feasibility Study', 'DPR Reports', 'Case Studies', 'Audit Reports'] },
  { name: 'Technical papers', subcategories: ['Research Journals', 'Conference Papers', 'Patents', 'Standards'] },
  { name: 'Templates & checklists', subcategories: ['Civil', 'Checklists', 'Design', 'QA', 'SOPs', 'Inspection Forms'] },
  { name: 'Workshop & webinars', subcategories: ['Recordings', 'Upcoming Sessions', 'Presentation Slides', 'Notes'] }
];

const initialDisciplines = [
  // Engineering Disciplines
  { name: 'Civil Engineering', type: 'Engineering' },
  { name: 'Mechanical Engineering', type: 'Engineering' },
  { name: 'Electrical Engineering', type: 'Engineering' },
  { name: 'Electronics Engineering', type: 'Engineering' },
  { name: 'Computer Engineering', type: 'Engineering' },
  { name: 'Chemical Engineering', type: 'Engineering' },
  { name: 'Industrial Engineering', type: 'Engineering' },
  { name: 'Software Engineering', type: 'Engineering' },
  { name: 'Marine Engineering', type: 'Engineering' },
  // Professional Disciplines
  { name: 'Information Technology', type: 'Professional' },
  { name: 'Architecture', type: 'Professional' },
  { name: 'Project Management', type: 'Professional' },
  { name: 'Finance', type: 'Professional' },
  { name: 'Accounting', type: 'Professional' },
  { name: 'Human Resources', type: 'Professional' },
  { name: 'Legal', type: 'Professional' },
  { name: 'Healthcare', type: 'Professional' },
  { name: 'Education', type: 'Professional' },
  { name: 'Business Management', type: 'Professional' },
  { name: 'HSE – Health, Safety & Environment', type: 'Professional' }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    console.log('Seeding Resource Categories...');
    for (const cat of initialCategories) {
      await ResourceCategory.findOneAndUpdate(
        { name: cat.name },
        { $set: { name: cat.name, subcategories: cat.subcategories } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Resource Categories seeded successfully');

    console.log('Seeding Disciplines...');
    for (const disc of initialDisciplines) {
      const lower = disc.name.trim().toLowerCase();
      const existing = await Discipline.findOne({
        $or: [{ name: disc.name }, { nameLower: lower }],
      });
      if (!existing) {
        await Discipline.create({
          name: disc.name,
          nameLower: lower,
          type: disc.type,
          isActive: true,
        });
      } else {
        existing.name = disc.name;
        existing.nameLower = lower;
        existing.type = disc.type;
        existing.isActive = true;
        await existing.save();
      }
    }
    console.log('Disciplines seeded successfully');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
