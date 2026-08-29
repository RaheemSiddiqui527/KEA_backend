import ResourceCategory from '../models/resourceCategory.models.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ResourceCategory.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

    const category = await ResourceCategory.create({ name, subcategories: subcategories || [] });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create category. It might already exist.' });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await ResourceCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ResourceCategory.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};
