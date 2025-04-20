import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const analyzeResume = async (filePath, requiredSkills, requiredExperience) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text.toLowerCase();

    // Calculate skill match percentage
    const matchedSkills = requiredSkills.filter(skill => 
      text.includes(skill.toLowerCase())
    );
    const skillMatch = matchedSkills.length > 0 
      ? (matchedSkills.length / requiredSkills.length) * 100 
      : 0;

    // Extract experience
    let extractedExperience = 0;
    const experienceRegex = /(\d+)\s*(years?|yrs?|months?|mos?)/gi;
    let match;
    while ((match = experienceRegex.exec(text)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.includes('year') || unit.includes('yr')) {
        extractedExperience += value * 12;
      } else {
        extractedExperience += value;
      }
    }
    extractedExperience = Math.floor(extractedExperience / 12); // Convert to years

    // Calculate priority based on various factors
    let priority = 1;
    if (text.includes('certification') || text.includes('certified')) priority++;
    if (extractedExperience >= requiredExperience) priority += 2;
    else if (extractedExperience >= requiredExperience * 0.5) priority++;
    if (skillMatch > 75) priority++;
    if (text.includes('honors') || text.includes('distinction')) priority++;

    return {
      skillMatch: Math.round(skillMatch),
      experienceMatch: extractedExperience >= requiredExperience,
      priority: Math.min(priority, 5),
      extractedExperience
    };
  } catch (error) {
    throw error;
  }
};

// Submit application
router.post('/', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const job = await Job.findById(req.body.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const analysis = await analyzeResume(req.file.path, job.requiredSkills, job.experienceRequired);
    
    const responseData = {
      skillMatch: analysis.skillMatch,
      experienceMatch: analysis.experienceMatch,
      message: analysis.skillMatch >= 50 && analysis.experienceMatch 
        ? 'Application submitted successfully' 
        : 'Your skills or experience do not meet the job requirements'
    };

    if (analysis.skillMatch >= 50 && analysis.experienceMatch) {
      const application = new Application({
        user: req.user._id,
        job: job._id,
        resume: req.file.filename,
        skillMatch: analysis.skillMatch,
        experienceMatch: analysis.experienceMatch,
        priority: analysis.priority,
        status: 'applied'
      });

      await application.save();
      responseData.application = application;
    }

    res.status(analysis.skillMatch >= 50 && analysis.experienceMatch ? 201 : 400).json(responseData);
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's applications
router.get('/user', protect, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job')
      .sort('-createdAt');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get application stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const newApplications = await Application.countDocuments({ status: 'applied' });
    const interviewing = await Application.countDocuments({ status: 'interviewing' });
    const selected = await Application.countDocuments({ status: 'selected' });
    const rejected = await Application.countDocuments({ status: 'rejected' });

    res.json({
      totalApplications,
      newApplications,
      interviewing,
      selected,
      rejected
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update application status (admin only)
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate('user job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const validTransitions = {
      applied: ['interviewing'],
      interviewing: ['underConsideration', 'rejected'], // Added rejected as valid
      underConsideration: ['selected', 'rejected'],
      selected: [],
      rejected: []
    };

    if (!validTransitions[application.status]?.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${application.status} to ${status}`
      });
    }

    application.status = status;
    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all applications (admin only)
// In your applicationRoutes.js (backend)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { jobId } = req.query;
    let query = {};
    
    if (jobId) {
      query.job = jobId;
    }

    const applications = await Application.find(query)
      .populate({
        path: 'user',
        select: 'name email phone experience education skills'
      })
      .populate({
        path: 'job',
        select: 'title salary jobType requiredSkills experienceRequired'
      })
      .sort('-priority');
      
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete application (admin only)
// In your applicationRoutes.js (backend)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete the resume file
    const filePath = path.join('uploads', application.resume);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Application.deleteOne({ _id: req.params.id }); // Changed from remove()
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;