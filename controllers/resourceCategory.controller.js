import ResourceCategory from '../models/resourceCategory.models.js';
import Resource from '../models/resource.models.js';

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

// Get all categories / folders with document counts
export const getAllCategories = async (req, res) => {
  try {
    let categories = await ResourceCategory.find().sort({ name: 1 });

    // Auto-seed if database is empty so knowledge hub never shows blank
    if (categories.length === 0) {
      for (const cat of initialCategories) {
        await ResourceCategory.create(cat);
      }
      categories = await ResourceCategory.find().sort({ name: 1 });
    }

    // Aggregate resource counts per category
    const counts = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          totalCount: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id] = {
          total: c.totalCount,
          approved: c.approvedCount,
        };
      }
    });

    const categoriesWithStats = categories.map((cat) => {
      const stats = countMap[cat.name] || { total: 0, approved: 0 };
      return {
        _id: cat._id,
        name: cat.name,
        subcategories: cat.subcategories || [],
        documentCount: stats.total,
        approvedDocumentCount: stats.approved,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    res.json({ success: true, categories: categoriesWithStats });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

// Create a new category / folder
export const createCategory = async (req, res) => {
  try {
    let { name, subcategories } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Folder / category name is required' });
    }

    name = name.trim();

    // Check case-insensitive duplicate
    const existing = await ResourceCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A folder with this name already exists' });
    }

    const cleanSubs = Array.isArray(subcategories)
      ? subcategories.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
      : [];

    const category = await ResourceCategory.create({
      name,
      subcategories: cleanSubs,
    });

    res.status(201).json({ success: true, category, message: 'Folder created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create category' });
  }
};

// Update a category / folder
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subcategories } = req.body;

    const category = await ResourceCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    const oldName = category.name;

    if (name && name.trim()) {
      const newName = name.trim();
      if (newName.toLowerCase() !== oldName.toLowerCase()) {
        const existing = await ResourceCategory.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${newName}$`, 'i') },
        });
        if (existing) {
          return res.status(400).json({ success: false, error: 'Another folder with this name already exists' });
        }
      }
      category.name = newName;

      // Update all existing documents referencing the old category name
      if (oldName !== newName) {
        await Resource.updateMany({ category: oldName }, { category: newName });
      }
    }

    if (Array.isArray(subcategories)) {
      category.subcategories = subcategories
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean);
    }

    await category.save();

    res.json({ success: true, category, message: 'Folder updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

// Delete a category / folder with accidental deletion prevention
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ResourceCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    // Safety check: prevent accidental deletion of folders containing documents
    const docCount = await Resource.countDocuments({ category: category.name });
    if (docCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete folder "${category.name}" because it contains ${docCount} document(s). Please move or delete the documents first.`,
      });
    }

    await ResourceCategory.findByIdAndDelete(id);

    res.json({ success: true, message: `Folder "${category.name}" deleted successfully` });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

// Add subfolder to folder
export const addSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategory } = req.body;

    if (!subcategory || !subcategory.trim()) {
      return res.status(400).json({ success: false, error: 'Subfolder name is required' });
    }

    const subName = subcategory.trim();
    const category = await ResourceCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    if (category.subcategories?.some((s) => s.toLowerCase() === subName.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Subfolder already exists in this folder' });
    }

    category.subcategories.push(subName);
    await category.save();

    res.json({ success: true, category, message: `Subfolder "${subName}" added successfully` });
  } catch (error) {
    console.error('Add subcategory error:', error);
    res.status(500).json({ success: false, error: 'Failed to add subfolder' });
  }
};

// Delete subfolder from folder
export const deleteSubcategory = async (req, res) => {
  try {
    const { id, subName } = req.params;
    const category = await ResourceCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    const decodedSubName = decodeURIComponent(subName);

    // Safety check: prevent deletion if documents exist inside this subfolder
    const docCount = await Resource.countDocuments({
      category: category.name,
      subcategory: decodedSubName,
    });

    if (docCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete subfolder "${decodedSubName}" because it contains ${docCount} document(s). Please move or delete the documents first.`,
      });
    }

    category.subcategories = category.subcategories.filter(
      (s) => s.toLowerCase() !== decodedSubName.toLowerCase()
    );
    await category.save();

    res.json({ success: true, category, message: `Subfolder "${decodedSubName}" deleted successfully` });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete subfolder' });
  }
};
