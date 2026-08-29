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
  { name: 'Career guidance', subcategories: [] },
  { name: 'Technical papers', subcategories: [] },
  { name: 'Project reports', subcategories: [] },
  { name: 'Workshop & webinars', subcategories: [] },
  { name: 'Templates & checklists', subcategories: [] },
  { 
    name: 'HSE – Health, Safety & Environment', 
    subcategories: [
      'Occupational Health', 'Workplace Health', 'Industrial Hygiene', 'Employee Wellbeing', 'Health Awareness',
      'Workplace Safety', 'Construction Safety', 'Industrial Safety', 'Fire Safety', 'Electrical Safety', 'Risk Assessment', 'Hazard Identification', 'PPE (Personal Protective Equipment)', 'Emergency Response', 'Safety Procedures',
      'Environmental Management', 'Sustainability', 'Waste Management', 'Pollution Control', 'Environmental Protection', 'Climate Awareness', 'ISO 14001', 'Environmental Compliance'
    ]
  },
  { name: 'Civil', subcategories: [] },
  { name: 'Mechanical', subcategories: [] },
  { name: 'Electrical', subcategories: [] },
  { name: 'Computer Science', subcategories: [] },
  { name: 'Electronics', subcategories: [] },
  { name: 'Chemical', subcategories: [] },
  { name: 'IT', subcategories: [] },
  { name: 'AI/ML', subcategories: [] },
  { name: 'Data Science', subcategories: [] }
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
        cat,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Resource Categories seeded successfully');

    console.log('Seeding Disciplines...');
    for (const disc of initialDisciplines) {
      await Discipline.findOneAndUpdate(
        { nameLower: disc.name.toLowerCase() },
        { ...disc, nameLower: disc.name.toLowerCase() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Disciplines seeded successfully');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
