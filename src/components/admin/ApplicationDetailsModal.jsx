import React from 'react';
import { FileText, User, Briefcase, Mail, Phone, Award, Clock, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ApplicationDetailsModal = ({ application, isOpen, onClose, onStatusUpdate, onDelete }) => {
  if (!isOpen || !application) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/applications/${application._id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      onStatusUpdate(newStatus);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5001/api/applications/${application._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      onDelete();
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Error deleting application');
    }
  };

  const getStatusOptions = (currentStatus) => {
    const options = {
      applied: ['interviewing'],
      interviewing: ['underConsideration'],
      underConsideration: ['selected', 'rejected'],
      selected: [],
      rejected: []
    };
    return options[currentStatus] || [];
  };

  const statusOptions = getStatusOptions(application.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <User className="h-5 w-5 mr-2" /> Candidate Information
            </h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {application.user?.name}</p>
              <p><span className="font-medium">Email:</span> {application.user?.email}</p>
              <p><span className="font-medium">Phone:</span> {application.user?.phone || 'Not provided'}</p>
              <p><span className="font-medium">Experience:</span> {application.user?.experience || 0} years</p>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" /> Job Information
            </h3>
            <div className="space-y-2">
              <p><span className="font-medium">Position:</span> {application.job?.title}</p>
              <p><span className="font-medium">Salary:</span> ${application.job?.salary}</p>
              <p><span className="font-medium">Type:</span> {application.job?.jobType}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Award className="h-5 w-5 mr-2" /> Skills & Qualifications
            </h3>
            <div className="mb-4">
              <h4 className="font-medium">Required Skills:</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {application.job?.requiredSkills?.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium">Candidate Skills:</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {application.user?.skills?.map((skill, index) => (
                  <span 
                    key={index} 
                    className={`text-xs px-2 py-1 rounded ${
                      application.job?.requiredSkills?.includes(skill) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium">Education:</h4>
              <p className="text-sm mt-1">{application.user?.education || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <FileText className="h-5 w-5 mr-2" /> Resume Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="font-medium">Skill Match</p>
              <p className="text-2xl font-bold">{application.skillMatch}%</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="font-medium">Experience</p>
              <p className="text-2xl font-bold">{application.user?.experience || 0} years</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="font-medium">Priority Score</p>
              <p className="text-2xl font-bold">{application.priority}/5</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Change Status</h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.length > 0 ? (
              statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-md ${
                    status === 'selected' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))
            ) : (
              <p className="text-gray-500">No further status transitions available</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <a
            href={`http://localhost:5001/uploads/${application.resume}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <FileText className="h-5 w-5 mr-2" /> View Full Resume
          </a>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <X className="h-5 w-5 mr-2" /> Delete Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;