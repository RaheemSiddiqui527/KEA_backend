import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "Kokani Engineers & Professionals Association (KEA)" },
  siteUrl: String,
  adminEmail: String,
  contactEmail: { type: String, default: "support@kokaniengineers.org" },
  logo: String,
  smtpHost: String,
  smtpPort: String,
  smtpUsername: String,
  smtpPassword: String,
  smtpFromEmail: String,
  smtpFromName: String,
  allowRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: true },
  defaultMembershipStatus: { type: String, default: 'pending' },
  autoApproveMembers: { type: Boolean, default: false },
  autoApproveJobs: { type: Boolean, default: false },
  autoApproveBlogs: { type: Boolean, default: false },
  autoApproveEvents: { type: Boolean, default: false },
  moderationEmail: String,
  supportStaff: [String],

  // GLOBAL NAVIGATION MENU ITEMS
  navigationItems: {
    type: [
      {
        id: String,
        name: String,
        href: String,
        isButton: Boolean,
        buttonVariant: String,
        enabled: { type: Boolean, default: true },
        order: Number
      }
    ],
    default: [
      { id: "nav-home", name: "Home", href: "/", enabled: true, order: 1 },
      { id: "nav-about", name: "About", href: "/about", enabled: true, order: 2 },
      { id: "nav-career", name: "Career Portal", href: "/career-portal", enabled: true, order: 3 },
      { id: "nav-resources", name: "Resources", href: "/resources", enabled: true, order: 4 },
      { id: "nav-events", name: "Events", href: "/events", enabled: true, order: 5 },
      { id: "nav-contact", name: "Contact", href: "/contact", enabled: true, order: 6 },
      { id: "nav-signin", name: "Sign In", href: "/login", isButton: true, buttonVariant: "secondary", enabled: true, order: 7 },
      { id: "nav-join", name: "Join KEA", href: "/register", isButton: true, buttonVariant: "primary", enabled: true, order: 8 }
    ]
  },

  // GLOBAL HEADER CONFIG
  headerConfig: {
    logoText: { type: String, default: "KEA" },
    logoSubtitle: { type: String, default: "KOKANI ENGINEERS & PROFESSIONALS ASSOCIATION" },
    logoUrl: { type: String, default: "" },
    bgGradientFrom: { type: String, default: "#0D2847" },
    bgGradientTo: { type: String, default: "#1a3a5c" },
    textColor: { type: String, default: "#ffffff" },
    activeColor: { type: String, default: "#f59e0b" },
    primaryBtnBg: { type: String, default: "#f59e0b" },
    primaryBtnText: { type: String, default: "#0D2847" }
  },

  // PUBLIC CMS CONTENT
  publicCMS: {
    heroTitle: { type: String, default: "Welcome to KEA" },
    heroSubtitle: { type: String, default: "Kokani Engineers & Professionals Association" },
    heroDescription: { type: String, default: "Everything you need to advance your engineering, professionals & technical career and connect with your community." },
    aboutTitle: { type: String, default: "About KEA & Our Services" },
    aboutDescription: { type: String, default: "Kokani Engineers & Professionals Association is a non-profit global organization dedicated to bringing together engineers, tech leaders, and professionals belonging to the Kokan region." },
    missionText: { type: String, default: "The Kokani Engineers & Professionals Association (KEA) is dedicated to uniting engineers from our community on a single global platform. Our mission is to foster professional growth, facilitate meaningful connections, and provide resources that empower every member to achieve excellence in their field." },
    visionText: { type: String, default: "To be the pre-eminent global network of the Kokani Engineers & Professionals Association (KEA), recognized for driving innovation, professional excellence, and community impact, while creating a legacy of technical leadership for generations to come." },
    contactEmail: { type: String, default: "support@kokaniengineers.org" },
    contactPhone: { type: String, default: "" },
    officeLocation: { type: String, default: "Mumbai & Konkan Region, Maharashtra, India" },
    disclaimerText: { type: String, default: "The information on this website is provided for general educational and professional networking guidance purposes only. Kokani Engineers & Professionals Association (KEA) does not guarantee specific placement outcomes or third-party service deliverables." }
  },

  // FOOTER CONFIG
  footerConfig: {
    aboutText: { type: String, default: "Empowering Kokani engineers, architects, IT leaders, and technical professionals worldwide." },
    copyrightText: { type: String, default: "Kokani Engineers & Professionals Association (KEA). All rights reserved." },
    contactEmail: { type: String, default: "support@kokaniengineers.org" },
    officeLocation: { type: String, default: "Mumbai & Konkan Region, Maharashtra, India" }
  },

  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      jobUpdates: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'members', 'private'],
        default: 'members'
      },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);