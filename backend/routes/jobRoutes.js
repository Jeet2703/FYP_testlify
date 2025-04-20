import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js'; // Add this import
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new job (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.requirements) {
      return res.status(400).json({ message: 'Title, description, and requirements are required' });
    }

    const job = new Job({
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements,
      salary: Number(req.body.salary),
      requiredSkills: Array.isArray(req.body.requiredSkills) ? req.body.requiredSkills : [],
      experienceRequired: Number(req.body.experienceRequired),
      jobType: req.body.jobType || 'full-time'
    });

    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ 
      message: 'Failed to create job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a job (admin only)
router.patch('/:id', protect, admin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] != null) {
        job[key] = req.body[key];
      }
    });

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a job (admin only)
// Update the delete route in jobRoutes.js
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    // First delete all applications associated with this job
    await Application.deleteMany({ job: req.params.id });
    
    // Then delete the job itself
    const result = await Job.deleteOne({ _id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json({ 
      message: 'Job and all associated applications deleted successfully',
      deletedApplications: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ 
      message: 'Failed to delete job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add this to your existing jobRoutes.js
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $project: {
          title: 1,
          jobType: 1,
          applicationCount: { $size: '$applications' },
          statusCounts: {
            applied: {
              $size: {
                $filter: {
                  input: '$applications',
                  as: 'app',
                  cond: { $eq: ['$$app.status', 'applied'] }
                }
              }
            },
            interviewing: {
              $size: {
                $filter: {
                  input: '$applications',
                  as: 'app',
                  cond: { $eq: ['$$app.status', 'interviewing'] }
                }
              }
            },
            underConsideration: {
              $size: {
                $filter: {
                  input: '$applications',
                  as: 'app',
                  cond: { $eq: ['$$app.status', 'underConsideration'] }
                }
              }
            },
            selected: {
              $size: {
                $filter: {
                  input: '$applications',
                  as: 'app',
                  cond: { $eq: ['$$app.status', 'selected'] }
                }
              }
            },
            rejected: {
              $size: {
                $filter: {
                  input: '$applications',
                  as: 'app',
                  cond: { $eq: ['$$app.status', 'rejected'] }
                }
              }
            }
          }
        }
      },
      { $sort: { applicationCount: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;