import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import { FileText, User, Briefcase, ChevronRight, Search, Award, Clock, Star } from 'lucide-react';
import axios from 'axios';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import CreateJobModal from './CreateJobModal';
import JobsStats from './JobStats.jsx';

const phases = ['applied', 'interviewing', 'underConsideration', 'selected', 'rejected'];

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsStats, setJobsStats] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    newApplications: 0,
    interviewing: 0,
    selected: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'jobs'

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    };
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5001/api/applications?populate=user,job',
        getAuthHeaders()
      );
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error fetching applications');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/jobs', getAuthHeaders());
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error fetching jobs');
    }
  };

  const fetchJobsStats = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/jobs/stats', getAuthHeaders());
      setJobsStats(response.data);
    } catch (error) {
      console.error('Error fetching job stats:', error);
      toast.error('Error fetching job statistics');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/applications/stats', getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error fetching stats');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([
          fetchApplications(),
          fetchJobs(),
          fetchStats(),
          fetchJobsStats()
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setApplications([]);
        setJobs([]);
        setJobsStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourcePhase = phases[source.droppableId];
    const destPhase = phases[destination.droppableId];

    if (source.droppableId === destination.droppableId) return;

    try {
      // Optimistic update
      setApplications(prevApps =>
        prevApps.map(app =>
          app._id === draggableId ? { ...app, status: destPhase } : app
        )
      );

      await axios.patch(
        `http://localhost:5001/api/applications/${draggableId}/status`,
        { status: destPhase },
        getAuthHeaders()
      );

      fetchStats();
      toast.success('Application status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating application status');

      // Revert on error
      setApplications(prevApps =>
        prevApps.map(app =>
          app._id === draggableId ? { ...app, status: sourcePhase } : app
        )
      );
    }
  };

  const filteredApplications = Array.isArray(applications)
    ? applications.filter(app => {
      const matchesJob = !selectedJob || (app.job && app.job._id === selectedJob);
      const matchesSearch = searchTerm === '' ||
        (app.user && app.user.name && app.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.job && app.job.title && app.job.title.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesJob && matchesSearch;
    })
    : [];

  const getPhaseColor = (phase) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      interviewing: 'bg-yellow-100 text-yellow-800',
      underConsideration: 'bg-purple-100 text-purple-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 4) return 'bg-green-100 text-green-800';
    if (priority >= 3) return 'bg-blue-100 text-blue-800';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setIsCreateJobModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create New Job
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('applications')}
            className={`${activeTab === 'applications' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`${activeTab === 'jobs' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Jobs Statistics
          </button>
        </nav>
      </div>

      {activeTab === 'applications' ? (
      <>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Applications</p>
              <p className="text-2xl font-semibold">{stats.newApplications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <User className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Interviewing</p>
              <p className="text-2xl font-semibold">{stats.interviewing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Award className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Selected</p>
              <p className="text-2xl font-semibold">{stats.selected}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applicants or jobs..."
                className="pl-10 w-full p-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="p-2 border rounded-md"
              onChange={(e) => setSelectedJob(e.target.value)}
              value={selectedJob}
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
          </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {phases.map((phase, index) => (
            <div key={phase} className="bg-gray-100 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 capitalize">
                {phase.replace(/([A-Z])/g, ' $1').trim()} ({filteredApplications.filter(app => app.status === phase).length})
              </h2>
              <Droppable droppableId={String(index)}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 min-h-[200px]"
                  >
                    {filteredApplications
                      .filter(app => app.status === phase)
                      .sort((a, b) => b.priority - a.priority)
                      .map((app, idx) => (
                        <Draggable key={app._id} draggableId={app._id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-3 rounded shadow-sm cursor-pointer hover:shadow-md"
                              onClick={() => {
                                setSelectedApplication(app);
                                setIsApplicationModalOpen(true);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{app.user?.name || 'Unknown Applicant'}</h3>
                                  <p className="text-sm text-gray-600">{app.job?.title || 'No Job Title'}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getPhaseColor(app.status)} mb-1`}>
                                    {app.status}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(app.priority)}`}>
                                    Priority: {app.priority}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <div className="flex items-center">
                                  {app.user?.skills?.some(skill => skill.includes('Certified')) && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded mr-1">
                                      Certified
                                    </span>
                                  )}
                                  {app.user?.experience > 2 && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded mr-1">
                                      Experienced
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={`http://localhost:5001/uploads/${app.resume}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Resume
                                </a>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      </>
      ) : (
        <JobsStats jobsStats={jobsStats} fetchJobsStats={fetchJobsStats} />
      )}

<CreateJobModal
        isOpen={isCreateJobModalOpen}
        onClose={() => setIsCreateJobModalOpen(false)}
        onJobCreated={() => {
          fetchJobs();
          fetchJobsStats();
          setIsCreateJobModalOpen(false);
        }}
      />

      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          isOpen={isApplicationModalOpen}
          onClose={() => {
            setIsApplicationModalOpen(false);
            setSelectedApplication(null);
          }}
          onStatusUpdate={(newStatus) => {
            setApplications(prevApps =>
              prevApps.map(app =>
                app._id === selectedApplication._id ? { ...app, status: newStatus } : app
              )
            );
            fetchStats();
            fetchJobsStats();
          }}
          onDelete={() => {
            setApplications(prevApps =>
              prevApps.filter(app => app._id !== selectedApplication._id)
            );
            fetchStats();
            fetchJobsStats();
            setIsApplicationModalOpen(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;