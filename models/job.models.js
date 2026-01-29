import mongoose from 'mongoose';

// const JobSchema = new mongoose.Schema({
//   title: { 
//     type: String, 
//     required: true 
//   },
//   description: { 
//     type: String,
//     required: true
//   },
//   requirements: String,
//   company: { 
//     type: String,
//     required: true
//   },
//   location: { 
//     type: String,
//     required: true
//   },
//   type: { 
//     type: String,
//     enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'],
//     required: true
//   },
//   salary: String,
//   postedBy: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User',
//     required: true
//   },
//   status: { 
//     type: String, 
//     enum: ['pending', 'approved', 'rejected'], 
//     default: 'pending' 
//   },
//   applyUrl: String,
//   tags: [String]
// }, { 
//   timestamps: true 
// });

// Text index for search

const JobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    required: true
  },

  // ✅ FIX HERE
  requirements: {
    type: [String],
    default: []
  },

  company: { 
    type: String,
    required: true
  },
  location: { 
    type: String,
    required: true
  },
  type: { 
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'],
    required: true
  },
  salary: String,
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  applyUrl: String,
  tags: [String]
}, { timestamps: true });


JobSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text' 
});

export default mongoose.model('Job', JobSchema);