import Discipline from '../models/discipline.models.js';

// Get all active disciplines
export const getActiveDisciplines = async (req, res) => {
  try {
    const disciplines = await Discipline.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, disciplines });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch disciplines' });
  }
};

// Get all disciplines (for Admin)
export const getAllDisciplines = async (req, res) => {
  try {
    const disciplines = await Discipline.find().sort({ name: 1 });
    res.json({ success: true, disciplines });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch disciplines' });
  }
};

// Create a new discipline manually (Admin)
export const createDiscipline = async (req, res) => {
  try {
    const { name, type, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Discipline name is required' });

    const discipline = await Discipline.create({ name, type, isActive: isActive !== undefined ? isActive : true });
    res.status(201).json({ success: true, discipline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create discipline. It might already exist.' });
  }
};

// Update a discipline
export const updateDiscipline = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const discipline = await Discipline.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!discipline) return res.status(404).json({ success: false, error: 'Discipline not found' });

    res.json({ success: true, discipline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update discipline' });
  }
};

// Delete a discipline
export const deleteDiscipline = async (req, res) => {
  try {
    const { id } = req.params;
    const discipline = await Discipline.findByIdAndDelete(id);
    if (!discipline) return res.status(404).json({ success: false, error: 'Discipline not found' });

    res.json({ success: true, message: 'Discipline deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete discipline' });
  }
};

// Find or Create (Auto-save logic for "Other" option)
export const findOrCreateDiscipline = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Discipline name is required' });

    const nameLower = name.trim().toLowerCase();

    // Check if it already exists
    let discipline = await Discipline.findOne({ nameLower });
    
    if (!discipline) {
      // Create new
      discipline = await Discipline.create({
        name: name.trim(),
        type: type || 'Uncategorized',
        isActive: true,
      });
    }

    res.json({ success: true, discipline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to find or create discipline' });
  }
};
