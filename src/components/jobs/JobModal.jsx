import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload, AlertCircle, Check, Briefcase, DollarSign, Clock, Award } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const JobModal = ({ job, isOpen, onClose, onApplicationSubmit }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error('Please upload resume');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobId', job._id);

    try {
      const response = await axios.post('http://localhost:5001/api/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (response.data.skillMatch < 50 || !response.data.experienceMatch) {
        toast.error(`Your skills or experience do not meet the job requirements (${response.data.skillMatch}% match)`);
        return;
      }

      toast.success('Application submitted successfully!');
      onApplicationSubmit();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded bg-white p-6">
          <div className="flex justify-between items-start">
            <Dialog.Title className="text-2xl font-bold">{job.title}</Dialog.Title>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Job Description
              </h3>
              <p className="mt-2 text-gray-600">{job.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Requirements
              </h3>
              <p className="mt-2 text-gray-600 whitespace-pre-line">{job.requirements}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Salary
                </h3>
                <p className="mt-2 text-gray-600">${job.salary.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Experience Required
                </h3>
                <p className="mt-2 text-gray-600">
                  {job.experienceRequired >= 12 
                    ? `${Math.floor(job.experienceRequired / 12)} years` 
                    : `${job.experienceRequired} months`}
                </p>
              </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Job Type
                </h3>
                <p className="mt-2 text-gray-600 capitalize">
                  {job.jobType.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Resume (PDF only)</h3>
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                {resumeFile ? (
                  <div className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    <p className="text-sm font-medium text-gray-700">{resumeFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF only (max. 5MB)</p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleResumeChange}
                />
              </label>
            </div>

            <div className="flex items-center text-sm text-yellow-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              Your resume will be analyzed for required skills and experience
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!resumeFile || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  !resumeFile || isSubmitting
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default JobModal;