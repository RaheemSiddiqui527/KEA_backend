import Page from '../models/page.model.js';

// Get public page by slug
export const getPublicPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug, isPublished: true });
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found or unpublished' });
    }

    // Return enabled sections ordered by position
    const activeSections = (page.sections || [])
      .filter(s => s.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      name: page.name,
      slug: page.slug,
      title: page.title,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      sections: activeSections
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all pages list
export const getAllPagesAdmin = async (req, res, next) => {
  try {
    const pages = await Page.find().sort({ name: 1 });
    res.json(pages);
  } catch (err) {
    next(err);
  }
};

// Admin: Get single page details for builder
export const getAdminPageDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    let page = await Page.findOne({ $or: [{ _id: id }, { slug: id }] });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    next(err);
  }
};

// Admin: Save draft sections
export const savePageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { draftSections, title, seoTitle, metaDescription } = req.body;

    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    page.draftSections = draftSections || page.draftSections;
    page.title = title !== undefined ? title : page.title;
    page.seoTitle = seoTitle !== undefined ? seoTitle : page.seoTitle;
    page.metaDescription = metaDescription !== undefined ? metaDescription : page.metaDescription;

    await page.save();
    res.json({ message: 'Draft saved successfully', page });
  } catch (err) {
    next(err);
  }
};

// Admin: Publish draft sections live
export const publishPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Backup current live sections before publishing
    if (page.sections && page.sections.length > 0) {
      page.versionHistory.unshift({
        savedAt: new Date(),
        savedBy: req.user?.name || 'Super Admin',
        sections: page.sections,
        title: page.title,
        metaTitle: page.seoTitle,
        metaDescription: page.metaDescription
      });

      // Keep maximum 10 version backups
      if (page.versionHistory.length > 10) {
        page.versionHistory = page.versionHistory.slice(0, 10);
      }
    }

    // Set live sections to draft sections (or body if passed)
    const newSections = req.body.sections || page.draftSections || page.sections;
    page.sections = newSections;
    page.draftSections = newSections;
    page.isPublished = true;

    await page.save();
    res.json({ message: 'Page published live successfully', page });
  } catch (err) {
    next(err);
  }
};

// Admin: Restore historical version
export const restorePageVersion = async (req, res, next) => {
  try {
    const { id, versionIndex } = req.params;
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const idx = parseInt(versionIndex, 10);
    if (isNaN(idx) || !page.versionHistory[idx]) {
      return res.status(400).json({ message: 'Invalid version snapshot index' });
    }

    const snapshot = page.versionHistory[idx];
    page.draftSections = snapshot.sections;
    page.sections = snapshot.sections;
    if (snapshot.title) page.title = snapshot.title;

    await page.save();
    res.json({ message: 'Page version restored successfully', page });
  } catch (err) {
    next(err);
  }
};

// Admin: Create new page
export const createPage = async (req, res, next) => {
  try {
    const { name, slug, title, seoTitle, metaDescription } = req.body;
    
    // Check if slug exists
    const existing = await Page.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Page slug already exists' });
    }

    const defaultHeroSection = [
      {
        id: `hero-${Date.now()}`,
        type: 'hero',
        title: title || name,
        subtitle: 'Kokani Engineers & Professionals Association',
        content: `Welcome to the ${name} page.`,
        bgColor: '#0D2847',
        textColor: '#ffffff',
        enabled: true,
        order: 1
      }
    ];

    const page = await Page.create({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: title || name,
      seoTitle,
      metaDescription,
      isPublished: true,
      sections: defaultHeroSection,
      draftSections: defaultHeroSection
    });

    res.status(201).json({ message: 'Page created successfully', page });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete page
export const deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Protect core pages
    const coreSlugs = ['home', 'about', 'career-portal', 'resources', 'events', 'contact'];
    if (coreSlugs.includes(page.slug)) {
      return res.status(400).json({ message: 'Core system page cannot be deleted' });
    }

    await Page.findByIdAndDelete(id);
    res.json({ message: 'Page deleted successfully' });
  } catch (err) {
    next(err);
  }
};
