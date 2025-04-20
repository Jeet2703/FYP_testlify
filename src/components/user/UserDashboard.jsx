import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Clock, Check, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import JobModal from '../jobs/JobModal';

const UserDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/applications/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }),
        axios.get('http://localhost:5001/api/jobs')
      ]);
      setApplications(appsRes.data);
      setJobs(jobsRes.data);
    } catch (error) {
      toast.error('Error fetching data');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'selected':
        return <Check className="w-4 h-4 mr-1 text-green-500" />;
      case 'rejected':
        return <X className="w-4 h-4 mr-1 text-red-500" />;
      default:
        return <Briefcase className="w-4 h-4 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Briefcase className="w-6 h-6 mr-2" />
          My Applications
        </h2>
        {applications.length === 0 ? (
          <p className="text-gray-500">You haven't applied to any jobs yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <div key={app._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{app.job?.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'selected' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  {getStatusIcon(app.status)}
                  <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm font-medium">Skill Match: </span>
                  <span className={`font-semibold ${
                    app.skillMatch > 75 ? 'text-green-600' :
                    app.skillMatch > 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {app.skillMatch}%
                  </span>
                </div>
                <a
                  href={`http://localhost:5001/uploads/${app.resume}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View Resume
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Jobs</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.filter(job => job.status === 'open').map((job) => (
            <div 
              key={job._id} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedJob(job);
                setIsModalOpen(true);
              }}
            >
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Salary: </span>
                  <span>${job.salary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Experience Required: </span>
                  <span>
                    {job.experienceRequired >= 12 
                      ? `${Math.floor(job.experienceRequired / 12)} years` 
                      : `${job.experienceRequired} months`}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Job Type: </span>
                  <span className="capitalize">
                    {job.jobType.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="font-medium">Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedJob(null);
          }}
          onApplicationSubmit={fetchData}
        />
      )}
    </div>
  );
};

export default UserDashboard;